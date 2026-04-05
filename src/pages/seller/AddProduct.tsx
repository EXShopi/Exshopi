import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import ImageUploader from '../components/ImageUploader';

const AddProduct = () => {
  const { register, handleSubmit, setValue } = useForm();
  const [images, setImages] = useState([]);
  const [variantCount, setVariantCount] = useState(1);

  const onSubmit = (data) => {
    console.log(data);
    // Submit the product data to the server
  };

  const handleImageUpload = (uploadedImages) => {
    setImages(uploadedImages);
  };

  const addVariant = () => {
    setVariantCount(variantCount + 1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}> 
      <h2>Step 1: Select Category</h2>
      <select {...register('category')}> {/* Category mapping logic */} </select>
      
      <h2>Step 2: Basic Info</h2>
      <input {...register('productName')} placeholder="Product Name" />
      <textarea {...register('description')} placeholder="Product Description" />

      <h2>Step 3: Media Upload</h2>
      <ImageUploader onUpload={handleImageUpload} />

      <h2>Step 4: Pricing</h2>
      <input type="number" {...register('price')} placeholder="Price" />

      <h2>Step 5: Specifications</h2>
      <input {...register('specs')} placeholder="Specifications" />

      <h2>Step 6: Shipping Information</h2>
      <input {...register('shipping')} placeholder="Shipping Info" />

      <h2>Step 7: SEO Details</h2>
      <input {...register('seoKeywords')} placeholder="SEO Keywords" />

      <h2>Step 8: Preview</h2>
      <button type="button" onClick={addVariant}>Add Variant</button>
      <div>{variantCount} variants added</div>

      <button type="submit">Submit Product</button>
    </form>
  );
};

export default AddProduct;