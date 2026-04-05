import React from 'react';
import { useForm } from 'react-hook-form';

const AddProduct = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    // Handle product addition logic here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Product Name</label>
        <input {...register('name', { required: true })} />
        {errors.name && <span>This field is required</span>}
      </div>
      <div>
        <label>Price</label>
        <input type="number" {...register('price', { required: true, min: 0 })} />
        {errors.price && <span>This field is required and must be greater than 0</span>}
      </div>
      <button type="submit">Add Product</button>
    </form>
  );
};

export default AddProduct;