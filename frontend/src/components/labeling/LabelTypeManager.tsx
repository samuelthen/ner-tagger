import React, { useState } from 'react';
import { ChevronDown, X, Plus, Save, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase'

interface LabelType {
  id: number;
  project_id: number;
  key: string;
  name: string;
  color: string;
  hotkey: string;
  description: string | null;
  created_at: string;
}

interface LabelTypeManagerProps {
  labelTypes: LabelType[];
  projectId: number;
  onUpdate: (updatedTypes: LabelType[]) => Promise<void>;
}

const LabelTypeManager: React.FC<LabelTypeManagerProps> = ({ 
  labelTypes, 
  projectId, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingType, setEditingType] = useState<LabelType | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [newType, setNewType] = useState<Omit<LabelType, 'id' | 'created_at'>>({
    name: '',
    color: '#3B82F6',
    hotkey: '',
    description: null,
    key: '',
    project_id: projectId
  });

  const validateLabelType = (type: Partial<LabelType>): string => {
    if (!type.name?.trim()) {
      return 'Name is required';
    }
    if (!type.hotkey?.trim()) {
      return 'Hotkey is required';
    }
    if (!type.key?.trim()) {
      return 'Key is required';
    }
    if (labelTypes.some(t => 
      t.hotkey.toLowerCase() === type.hotkey?.toLowerCase() && 
      t.id !== (editingType?.id ?? null)
    )) {
      return 'Hotkey is already in use';
    }
    if (labelTypes.some(t => 
      t.key.toLowerCase() === type.key?.toLowerCase() && 
      t.id !== (editingType?.id ?? null)
    )) {
      return 'Key is already in use';
    }
    return '';
  };

  const handleCreate = async (): Promise<void> => {
    try {
      const validationError = validateLabelType(newType);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Insert the new label type into Supabase
      const { data: insertedLabelType, error: insertError } = await supabase
        .from('label_types')
        .insert({
          project_id: projectId,
          key: newType.key,
          name: newType.name,
          color: newType.color,
          hotkey: newType.hotkey.toUpperCase(),
          description: newType.description
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (!insertedLabelType) {
        throw new Error('Failed to create label type');
      }

      // Update local state with the newly created label type
      await onUpdate([...labelTypes, insertedLabelType]);
      
      // Reset form
      setNewType({
        name: '',
        color: '#3B82F6',
        hotkey: '',
        description: null,
        key: '',
        project_id: projectId
      });
      setShowAddForm(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create label type');
      console.error('Error creating label type:', err);
    }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editingType) return;

    try {
      const validationError = validateLabelType(editingType);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Update the label type in Supabase
      const { data: updatedLabelType, error: updateError } = await supabase
        .from('label_types')
        .update({
          key: editingType.key,
          name: editingType.name,
          color: editingType.color,
          hotkey: editingType.hotkey.toUpperCase(),
          description: editingType.description
        })
        .eq('id', editingType.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedLabelType) {
        throw new Error('Failed to update label type');
      }

      // Update local state
      await onUpdate(labelTypes.map(t => t.id === editingType.id ? updatedLabelType : t));
      setIsEditing(false);
      setEditingType(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update label type');
      console.error('Error updating label type:', err);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      // Delete the label type from Supabase
      const { error: deleteError } = await supabase
        .from('label_types')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Update local state
      await onUpdate(labelTypes.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete label type');
      console.error('Error deleting label type:', err);
    }
  };


  return (
    <div className="space-y-4 p-4 bg-white rounded-lg">
      {error && (
        <div className="flex items-center gap-2 p-3 text-red-800 bg-red-100 rounded-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Label Types
          <ChevronDown className="h-4 w-4" />
        </h3>
        
        <div className="space-y-1">
          {labelTypes.map(type => (
            <div key={type.id} className="flex items-center gap-2 group">
              <button
                className="flex-1 flex items-center justify-between p-2 rounded hover:bg-gray-100"
                onClick={() => {
                  setEditingType(type);
                  setIsEditing(true);
                  setError('');
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: type.color }}
                  />
                  <span>{type.name}</span>
                  <span className="text-gray-500 text-sm">({type.key})</span>
                </div>
                <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">
                  {type.hotkey}
                </kbd>
              </button>
              <button
                className="p-1 hover:bg-red-100 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(type.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        {isEditing && editingType && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3 mt-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={editingType.name}
                onChange={(e) => {
                  setEditingType({
                    ...editingType,
                    name: e.target.value,
                    key: e.target.value.toUpperCase().replace(/\s+/g, '_')
                  });
                  setError('');
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Key</label>
              <input
                type="text"
                value={editingType.key}
                onChange={(e) => {
                  setEditingType({
                    ...editingType,
                    key: e.target.value.toUpperCase()
                  });
                  setError('');
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <input
                type="text"
                value={editingType.description || ''}
                onChange={(e) => setEditingType({
                  ...editingType,
                  description: e.target.value || null
                })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Color</label>
              <input
                type="color"
                value={editingType.color}
                onChange={(e) => setEditingType({ ...editingType, color: e.target.value })}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Hotkey</label>
              <input
                type="text"
                value={editingType.hotkey}
                onChange={(e) => {
                  setEditingType({ ...editingType, hotkey: e.target.value.toUpperCase() });
                  setError('');
                }}
                maxLength={1}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingType(null);
                  setError('');
                }}
                className="flex-1 bg-gray-200 p-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAddForm ? (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={newType.name}
              onChange={(e) => {
                setNewType({
                  ...newType,
                  name: e.target.value,
                  key: e.target.value.toUpperCase().replace(/\s+/g, '_')
                });
                setError('');
              }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Key</label>
            <input
              type="text"
              value={newType.key}
              onChange={(e) => {
                setNewType({
                  ...newType,
                  key: e.target.value.toUpperCase()
                });
                setError('');
              }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Description</label>
            <input
              type="text"
              value={newType.description || ''}
              onChange={(e) => setNewType({
                ...newType,
                description: e.target.value || null
              })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Color</label>
            <input
              type="color"
              value={newType.color}
              onChange={(e) => setNewType({ ...newType, color: e.target.value })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Hotkey</label>
            <input
              type="text"
              value={newType.hotkey}
              onChange={(e) => {
                setNewType({ ...newType, hotkey: e.target.value.toUpperCase() });
                setError('');
              }}
              maxLength={1}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white p-2 rounded hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewType({
                  name: '',
                  color: '#3B82F6',
                  hotkey: '',
                  description: null,
                  key: '',
                  project_id: projectId
                });
                setError('');
              }}
              className="flex-1 bg-gray-200 p-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add New Label Type
        </button>
      )}
    </div>
  );
};

export default LabelTypeManager;