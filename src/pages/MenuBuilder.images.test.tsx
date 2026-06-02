import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('@/store/useRestaurantStore', () => {
  const categories = [{ id: 'cat-1', name: 'Starters', icon: '🥗', sortOrder: 1 }];
  const menuItems = [
    {
      id: 'item-1',
      name: 'Test Dish',
      description: 'A tasty dish',
      categoryId: 'cat-1',
      price: 9.99,
      image: 'https://example.com/valid.jpg',
      prepTime: 10,
      stations: ['general'],
      available: true,
      modifiers: [],
      dietary: ['vegetarian'],
      popularity: 9.1,
      ingredients: ['A', 'B'],
      nutrition: { calories: 100, protein: 5, carbs: 10, fat: 3 },
      rating: 4.7,
      reviewCount: 12,
    },
  ];
  return {
    useRestaurantStore: () => ({
      menuItems,
      categories,
      toggleMenuItemAvailability: vi.fn(),
      addMenuItem: vi.fn(),
      deleteMenuItem: vi.fn(),
      updateMenuItem: vi.fn(),
    }),
  };
});

import MenuBuilder from './MenuBuilder';

describe('MenuBuilder images', () => {
  it('renders images with lazy loading and alt text', () => {
    render(<MenuBuilder />);
    const img = screen.getByRole('img', { name: 'Test Dish' }) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.alt).toBe('Test Dish');
  });

  it('falls back to placeholder image when original fails', () => {
    render(<MenuBuilder />);
    const img = screen.getByRole('img', { name: 'Test Dish' }) as HTMLImageElement;
    fireEvent.error(img);
    expect(img.src).toContain('images.unsplash.com');
  });
});

