import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { recipeSchema } from '../../utils/validators';
import { CUISINE_TYPES, DIFFICULTY_LEVELS, MEAL_TYPES } from '../../constants/roles';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Plus, Trash2, ImagePlus } from 'lucide-react';

const RecipeForm = ({ defaultValues, onSubmit, loading }) => {
  // ── Image state ──────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(defaultValues?.imageUrl || null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Form ─────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(recipeSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      cuisineType: '',
      difficulty: '',
      mealType: '',
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      servings: 2,
      tags: '',
      ingredients: [{ name: '', quantity: 1, unit: '' }],
      steps: [{ stepNumber: 1, instruction: '' }],
    },
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } =
    useFieldArray({ control, name: 'ingredients' });

  const { fields: stepFields, append: appendStep, remove: removeStep } =
    useFieldArray({ control, name: 'steps' });

  // Pass both form data and image file up to parent
  const handleFormSubmit = (data) => {
    if (typeof data.tags === 'string') {
      data.tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    
    // Filter out empty ingredients and steps
    data.ingredients = data.ingredients.filter((ing) => ing.name?.trim() && ing.unit?.trim());
    data.steps = data.steps.filter((step) => step.instruction && step.instruction.trim() !== '');
    
    onSubmit(data, imageFile);
  };

  const labelClass = 'block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1';
  const selectClass = 'input-base';
  const textareaClass = 'input-base resize-none';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-surface-800 dark:text-surface-200">Basic Information</h3>

        <Input
          label="Recipe Title"
          error={errors.title?.message}
          {...register('title')}
          placeholder="e.g. Classic Spaghetti Carbonara"
        />

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${textareaClass} h-24`}
            placeholder="Describe your recipe in detail..."
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* ── Recipe Image Upload ────────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Recipe Image</label>
          <div
            className="relative border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl overflow-hidden cursor-pointer hover:border-brand-400 transition-colors"
            onClick={() => document.getElementById('recipe-image-input').click()}
          >
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Recipe preview"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium flex items-center gap-2">
                    <ImagePlus className="w-4 h-4" /> Change image
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-2 text-surface-400">
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm">Click to upload recipe image</span>
                <span className="text-xs">JPG, PNG, WEBP up to 5 MB</span>
              </div>
            )}
          </div>
          <input
            id="recipe-image-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Cuisine Type</label>
            <select className={selectClass} {...register('cuisineType')}>
              <option value="">Select cuisine</option>
              {CUISINE_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.cuisineType && (
              <p className="text-xs text-red-500 mt-1">{errors.cuisineType.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Difficulty</label>
            <select className={selectClass} {...register('difficulty')}>
              <option value="">Select difficulty</option>
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.difficulty && (
              <p className="text-xs text-red-500 mt-1">{errors.difficulty.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Meal Type</label>
            <select className={selectClass} {...register('mealType')}>
              <option value="">Select meal type</option>
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.mealType && (
              <p className="text-xs text-red-500 mt-1">{errors.mealType.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Prep Time (min)"
            type="number"
            min="0"
            error={errors.prepTimeMinutes?.message}
            {...register('prepTimeMinutes', { valueAsNumber: true })}
          />
          <Input
            label="Cook Time (min)"
            type="number"
            min="0"
            error={errors.cookTimeMinutes?.message}
            {...register('cookTimeMinutes', { valueAsNumber: true })}
          />
          <Input
            label="Servings"
            type="number"
            min="1"
            error={errors.servings?.message}
            {...register('servings', { valueAsNumber: true })}
          />
        </div>

        <Input
          label="Tags (comma separated)"
          placeholder="e.g. healthy, quick, vegetarian"
          {...register('tags')}
        />
      </div>

      {/* Ingredients */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-surface-800 dark:text-surface-200">Ingredients</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={() => appendIngredient({ name: '', quantity: 1, unit: '' })}
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
        {ingredientFields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              className="input-base flex-1"
              placeholder="Ingredient name"
              {...register(`ingredients.${index}.name`)}
            />
            <input
              className="input-base w-24"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="Qty"
              {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
            />
            <input
              className="input-base w-24"
              placeholder="Unit"
              {...register(`ingredients.${index}.unit`)}
            />
            {ingredientFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-surface-800 dark:text-surface-200">Instructions</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={() => appendStep({ stepNumber: stepFields.length + 1, instruction: '' })}
          >
            <Plus className="w-4 h-4" /> Add Step
          </Button>
        </div>
        {stepFields.map((field, index) => (
          <div key={field.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
              {index + 1}
            </div>
            <div className="flex-1">
              <textarea
                className={`${textareaClass} h-20`}
                placeholder={`Step ${index + 1} instruction...`}
                {...register(`steps.${index}.instruction`)}
              />
            </div>
            {stepFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="text-red-400 hover:text-red-600 p-1 self-start mt-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Save Recipe
      </Button>
    </form>
  );
};

export default RecipeForm;