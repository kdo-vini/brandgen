import { useState } from 'react';
import type { GeneratedContent } from '../types';

export type EditableGeneratedField =
  | 'hook'
  | 'caption'
  | 'cta'
  | 'hashtags'
  | 'image_text'
  | 'image_prompt';

export type HumanEdit = {
  original: string;
  edited: string;
  editedAt: string;
};

export function useEditableFields(generatedContent: GeneratedContent | null) {
  const [editingField, setEditingField] =
    useState<EditableGeneratedField | null>(null);
  const [regeneratingField, setRegeneratingField] =
    useState<EditableGeneratedField | null>(null);
  const [humanEdits, setHumanEdits] = useState<Record<string, HumanEdit>>({});
  const [regenerationCounts, setRegenerationCounts] = useState<
    Record<string, number>
  >({});

  const resetEdits = () => {
    setHumanEdits({});
    setRegenerationCounts({});
  };

  const trackFieldEdit = (field: EditableGeneratedField, value: string) => {
    const originalValue =
      (generatedContent?.[field as keyof GeneratedContent] as string) || '';
    if (value !== originalValue) {
      setHumanEdits((prev) => ({
        ...prev,
        [field]: {
          original: originalValue,
          edited: value,
          editedAt: new Date().toISOString(),
        },
      }));
    }
  };

  const trackRegeneration = (field: EditableGeneratedField) => {
    setRegenerationCounts((prev) => ({
      ...prev,
      [field]: (prev[field] || 0) + 1,
    }));
  };

  return {
    editingField,
    setEditingField,
    regeneratingField,
    setRegeneratingField,
    humanEdits,
    regenerationCounts,
    resetEdits,
    trackFieldEdit,
    trackRegeneration,
  };
}
