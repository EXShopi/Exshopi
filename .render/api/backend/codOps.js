import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const codStatePath = path.join(__dirname, 'cod-state.json');
const initialState = {
    otpSessions: [],
    blacklist: [],
    notifications: [],
};
function loadState() {
    try {
        if (!fs.existsSync(codStatePath)) {
            fs.writeFileSync(codStatePath, JSON.stringify(initialState, null, 2));
            return { ...initialState };
        }
        const parsed = JSON.parse(fs.readFileSync(codStatePath, 'utf-8'));
        return {
            otpSessions: Array.isArray(parsed.otpSessions) ? parsed.otpSessions : [],
            blacklist: Array.isArray(parsed.blacklist) ? parsed.blacklist : [],
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        };
    }
    catch {
        return { ...initialState };
    }
}
function saveState(state) {
    fs.writeFileSync(codStatePath, JSON.stringify(state, null, 2));
}
function randomOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}
export function normalizePhone(phone) {
    const raw = String(phone || '').replace(/[^\d+]/g, '');
    if (raw.startsWith('+971'))
        return raw;
    if (raw.startsWith('971'))
        return `+${raw}`;
    if (raw.startsWith('05'))
        return `+971${raw.slice(1)}`;
    if (raw.startsWith('5'))
        return `+971${raw}`;
    return raw;
}
export function isValidUaePhone(phone) {
    return /^\+971(5\d{8}|[234679]\d{7,8})$/.test(normalizePhone(phone));
}
export function createCodOtpSession(input) {
    const state = loadState();
    const now = new Date();
    const existingRecent = state.otpSessions
        .filter((session) => session.phone === normalizePhone(input.phone) &&
        session.customerId === input.customerId &&
        !session.usedAt &&
        new Date(session.resendAvailableAt) > now)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (existingRecent) {
        throw new Error('Please wait before requesting another OTP.');
    }
    const session = {
        id: `codotp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        customerId: input.customerId,
        phone: normalizePhone(input.phone),
        email: String(input.email || '').trim().toLowerCase(),
        ip: input.ip,
        otpCode: randomOtp(),
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
        resendAvailableAt: new Date(now.getTime() + 60 * 1000).toISOString(),
        attempts: 0,
        createdAt: now.toISOString(),
    };
    state.otpSessions.unshift(session);
    state.otpSessions = state.otpSessions.slice(0, 1000);
    saveState(state);
    return session;
}
export function verifyCodOtpSession(sessionId, code) {
    const state = loadState();
    const session = state.otpSessions.find((item) => item.id === sessionId);
    if (!session)
        throw new Error('OTP session not found.');
    if (session.usedAt)
        throw new Error('This OTP session was already used.');
    if (new Date(session.expiresAt).getTime() < Date.now())
        throw new Error('OTP expired. Please resend.');
    if (session.attempts >= 5)
        throw new Error('Too many OTP attempts.');
    session.attempts += 1;
    if (session.otpCode !== String(code || '').trim()) {
        saveState(state);
        throw new Error('Invalid OTP code.');
    }
    session.verifiedAt = new Date().toISOString();
    saveState(state);
    return session;
}
export function consumeCodOtpVerification(sessionId, customerId, phone) {
    const state = loadState();
    const session = state.otpSessions.find((item) => item.id === sessionId);
    if (!session?.verifiedAt)
        throw new Error('Order phone verification is missing.');
    if (session.customerId !== customerId)
        throw new Error('OTP verification does not match the signed-in customer.');
    if (session.phone !== normalizePhone(phone))
        throw new Error('Verified phone does not match the checkout phone.');
    if (new Date(session.expiresAt).getTime() < Date.now())
        throw new Error('Verified OTP expired. Please try again.');
    // Allow one verified OTP session to cover the whole checkout split across multiple seller orders.
    session.usedAt = session.usedAt || new Date().toISOString();
    saveState(state);
    return session;
}
export function listBlacklistEntries() {
    return loadState().blacklist;
}
export function addBlacklistEntry(input) {
    const state = loadState();
    const normalizedValue = input.type === 'phone' ? normalizePhone(input.value) : String(input.value || '').trim().toLowerCase();
    const existing = state.blacklist.find((item) => item.type === input.type && item.value === normalizedValue);
    if (existing) {
        existing.active = true;
        existing.reason = input.reason;
        saveState(state);
        return existing;
    }
    const entry = {
        id: `blacklist_${Date.now()}`,
        type: input.type,
        value: normalizedValue,
        reason: input.reason,
        active: true,
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
    };
    state.blacklist.unshift(entry);
    saveState(state);
    return entry;
}
export function isBlacklisted(input) {
    const state = loadState();
    const normalizedPhone = input.phone ? normalizePhone(input.phone) : '';
    const normalizedEmail = String(input.email || '').trim().toLowerCase();
    const normalizedIp = String(input.ip || '').trim().toLowerCase();
    return state.blacklist.find((entry) => entry.active &&
        ((entry.type === 'phone' && entry.value === normalizedPhone) ||
            (entry.type === 'email' && entry.value === normalizedEmail) ||
            (entry.type === 'ip' && entry.value === normalizedIp)));
}
export function pushNotification(input) {
    const state = loadState();
    const notification = {
        ...input,
        id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        createdAt: new Date().toISOString(),
    };
    state.notifications.unshift(notification);
    state.notifications = state.notifications.slice(0, 3000);
    saveState(state);
    return notification;
}
export function getNotificationsForAudience(audience, audienceId) {
    const state = loadState();
    return state.notifications.filter((item) => item.audience === audience && (!item.audienceId || !audienceId || item.audienceId === audienceId));
}
export function calculateCodRisk(input) {
    const now = Date.now();
    const normalizedPhone = normalizePhone(input.phone);
    const normalizedEmail = String(input.email || '').trim().toLowerCase();
    const sameDayOrders = input.orders.filter((order) => {
        const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : 0;
        return now - createdAt < 24 * 60 * 60 * 1000;
    });
    const phoneOrders = sameDayOrders.filter((order) => normalizePhone(order.customerPhone || '') === normalizedPhone).length;
    const emailOrders = sameDayOrders.filter((order) => String(order.customerEmail || '').trim().toLowerCase() === normalizedEmail).length;
    const customerOrders = sameDayOrders.filter((order) => order.customerId === input.customerId).length;
    const reasons = [];
    if (phoneOrders >= 3)
        reasons.push('High daily order count from the same phone');
    if (emailOrders >= 4)
        reasons.push('High daily order count from the same email');
    if (customerOrders >= 4)
        reasons.push('Customer exceeded normal COD daily activity');
    return {
        riskLevel: reasons.length ? 'suspicious' : 'normal',
        reasons,
        hardBlocked: phoneOrders >= 5 || customerOrders >= 5,
    };
}
