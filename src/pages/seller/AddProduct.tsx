import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const AddProduct = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [category, setCategory] = useState('');
    const [formSteps, setFormSteps] = useState(1);
    const totalSteps = 8;

    const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(event.target.value);
    };

    const onSubmit = (data: any) => {
        // Logic to build the payload
        const payload = { ...data, category };
        console.log('Payload ready for submission:', payload);
        // Implement API call to submit the payload
    };

    const nextStep = () => {
        if (formSteps < totalSteps) {
            setFormSteps((prev) => prev + 1);
        }
    };

    const previousStep = () => {
        if (formSteps > 1) {
            setFormSteps((prev) => prev - 1);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {formSteps === 1 && (
                <div>
                    <label>Product Name</label>
                    <input {...register('productName', { required: true })} />
                    {errors.productName && <span>This field is required</span>}
                </div>
            )}
            {/* Add other form steps here - 2 to 8 */}
            <select onChange={handleCategoryChange} value={category}>
                <option value="">Select a category</option>
                <option value="category1">Category 1</option>
                <option value="category2">Category 2</option>
                {/* Add more categories as needed */}
            </select>
            <button type="button" onClick={previousStep}>Back</button>
            {formSteps < totalSteps && <button type="button" onClick={nextStep}>Next</button>}
            {formSteps === totalSteps && <button type="submit">Submit</button>}
        </form>
    );
};

export default AddProduct;