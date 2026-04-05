import React, { useState, useEffect } from 'react';

const AddProduct = () => {
  const [category, setCategory] = useState('');
  const [basicInfo, setBasicInfo] = useState({ name: '', description: '' });
  const [media, setMedia] = useState([]);
  const [pricing, setPricing] = useState({ price: '', salePrice: '' });
  const [specs, setSpecs] = useState({ weight: '', dimensions: '' });
  const [shipping, setShipping] = useState('');
  const [seo, setSeo] = useState({ title: '', keywords: '' });
  const [preview, setPreview] = useState({});

  useEffect(() => {
    // Load initial data if needed
  }, []);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setMedia(files);
  };

  const handleVariantChange = (variantIndex, field, value) => {
    // Logic for managing variants can be implemented here
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle the form submission logic
    // Validate the data and handle submission of all the states above
    if (!basicInfo.name || !pricing.price) {
      alert('Please fill out all required fields.');
      return;
    }
    setPreview({
      category,
      basicInfo,
      media,
      pricing,
      specs,
      shipping,
      seo,
    });
    console.log('Product data:', {
      category,
      basicInfo,
      media,
      pricing,
      specs,
      shipping,
      seo,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Product</h2>
      {/* Category Selection */}
      <label>
        Category:
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />
      </label>

      {/* Basic Info */}
      <label>
        Product Name:
        <input type="text" value={basicInfo.name} onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })} required />
      </label>
      <label>
        Description:
        <textarea value={basicInfo.description} onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })} required></textarea>
      </label>

      {/* Media Upload */}
      <label>
        Upload Images:
        <input type="file" multiple onChange={handleImageUpload} accept="image/*" />
      </label>

      {/* Pricing */}
      <label>
        Price:
        <input type="number" value={pricing.price} onChange={(e) => setPricing({ ...pricing, price: e.target.value })} required />
      </label>
      <label>
        Sale Price:
        <input type="number" value={pricing.salePrice} onChange={(e) => setPricing({ ...pricing, salePrice: e.target.value })} />
      </label>

      {/* Specs */}
      <label>
        Weight:
        <input type="text" value={specs.weight} onChange={(e) => setSpecs({ ...specs, weight: e.target.value })} />
      </label>
      <label>
        Dimensions:
        <input type="text" value={specs.dimensions} onChange={(e) => setSpecs({ ...specs, dimensions: e.target.value })} />
      </label>

      {/* Shipping */}
      <label>
        Shipping Info:
        <input type="text" value={shipping} onChange={(e) => setShipping(e.target.value)} />
      </label>

      {/* SEO */}
      <label>
        SEO Title:
        <input type="text" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
      </label>
      <label>
        SEO Keywords:
        <input type="text" value={seo.keywords} onChange={(e) => setSeo({ ...seo, keywords: e.target.value })} />
      </label>

      {/* Preview button */}
      <button type="submit">Submit</button>

      {/* Preview section */}
      <h3>Preview</h3>
      <pre>{JSON.stringify(preview, null, 2)}</pre>
    </form>
  );
};

export default AddProduct;