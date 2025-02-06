'use client'

import React, { useState, useEffect, useCallback, useRef, JSX } from 'react';
import { Search, Settings, Save, X } from 'lucide-react';
import { Label, LabelType } from '@/types/project';
import LabelTypeManager from '@/components/labeling/LabelTypeManager';

interface TextLabelerProps {
  text: string;
  initialLabels: Label[];
  labelTypes: LabelType[];
  onCreateLabel: (labelTypeId: number, startOffset: number, endOffset: number, value: string) => Promise<void>;
  onSaveLabels: (labels: Label[]) => Promise<void>;
  projectId: string;
  onLabelTypesUpdate: (types: LabelType[]) => void;
}

interface SelectionState {
  text: string;
  start: number;
  end: number;
}

const TextLabeler: React.FC<TextLabelerProps> = ({ 
  text, 
  initialLabels,
  labelTypes, 
  onCreateLabel, 
  onSaveLabels,
  projectId,
  onLabelTypesUpdate
}) => {
  // State management
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [selectedText, setSelectedText] = useState<SelectionState | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [searchOptions, setSearchOptions] = useState({
    searchAllFiles: false,
    regexSearch: false,
    exactMatch: false
  });

  const textContainerRef = useRef<HTMLDivElement>(null);
  const numericProjectId = parseInt(projectId, 10);

  // Filter for unique label types
  const uniqueLabelTypes = Array.from(new Map(labelTypes.map(type => [type.key, type])).values());

  // Helper function to get text content without HTML elements
  const getTextWithoutHtml = (element: HTMLElement): string => {
    return element.innerText || element.textContent || '';
  };

  // Calculate real offset in original text considering HTML elements
  const calculateRealOffset = useCallback((node: Node, offset: number): number => {
    if (!textContainerRef.current) return offset;

    const elements = Array.from(textContainerRef.current.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement);
    let realOffset = 0;
    let targetNode = node;
    
    while (targetNode.parentElement && targetNode.parentElement !== textContainerRef.current) {
      targetNode = targetNode.parentElement;
    }

    for (const element of elements) {
      if (element === targetNode) {
        if (node.nodeType === Node.TEXT_NODE) {
          realOffset += offset;
        } else {
          const elementText = getTextWithoutHtml(element);
          realOffset += Math.min(offset, elementText.length);
        }
        break;
      } else {
        realOffset += getTextWithoutHtml(element).length;
      }
    }

    return realOffset;
  }, []);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !textContainerRef.current) {
      setSelectedText(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const startOffset = calculateRealOffset(range.startContainer, range.startOffset);
    const endOffset = calculateRealOffset(range.endContainer, range.endOffset);
    
    const normalizedStart = Math.min(startOffset, endOffset);
    const normalizedEnd = Math.max(startOffset, endOffset);
    const selectedContent = text.substring(normalizedStart, normalizedEnd);

    if (selectedContent.trim()) {
      setSelectedText({
        text: selectedContent,
        start: normalizedStart,
        end: normalizedEnd
      });
    }
  }, [text, calculateRealOffset]);

  const addLabel = async (labelTypeId: number) => {
    if (!selectedText) return;
  
    // Validate that the label type exists
    const labelTypeExists = labelTypes.some(type => type.id === labelTypeId);
    if (!labelTypeExists) {
      console.error(`Label type with id ${labelTypeId} does not exist`);
      // Optionally show an error message to the user
      // You could add a state for error messages and display them in the UI
      return;
    }
  
    try {
      await onCreateLabel(
        labelTypeId,
        selectedText.start,
        selectedText.end,
        selectedText.text
      );
  
      const newLabel: Label = {
        id: Date.now(), // Note: This should be replaced with the actual ID from the server
        file_id: 0,
        label_type_id: labelTypeId,
        start_offset: selectedText.start,
        end_offset: selectedText.end,
        value: selectedText.text,
        created_by: '', // This should be set by the server
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
  
      setLabels(prev => [...prev, newLabel]);
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Error adding label:', error);
      // Optionally show an error message to the user
    }
  };
  
  // Also update the handleKeyPress function to include validation:
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const labelType = labelTypes.find(type => type.hotkey === e.key);
    if (labelType && selectedText) {
      addLabel(labelType.id);
    }
  }, [selectedText, labelTypes, addLabel]);

  // Remove a label
  const removeLabel = (labelId: number) => {
    setLabels(prev => prev.filter(label => label.id !== labelId));
  };


  useEffect(() => {
    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  // Render text with labels
  const renderText = () => {
    if (!text) return null;

    const sortedLabels = [...labels].sort((a, b) => a.start_offset - b.start_offset);
    let lastIndex = 0;
    const elements: JSX.Element[] = [];

    sortedLabels.forEach((label, index) => {
      if (label.start_offset > lastIndex) {
        elements.push(
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {text.slice(lastIndex, label.start_offset)}
          </span>
        );
      }

      const labelType = labelTypes.find(type => type.id === label.label_type_id);
      elements.push(
        <span
          key={label.id}
          style={{ backgroundColor: labelType?.color + '40' }}
          className="relative group cursor-pointer rounded px-1 whitespace-pre-wrap"
          data-label-id={label.id}
        >
          {text.slice(label.start_offset, label.end_offset)}
          <span className="absolute -top-5 left-0 hidden bg-gray-800 px-2 py-1 text-xs text-white rounded group-hover:block z-10">
            {labelType?.name}
            <button 
              onClick={() => removeLabel(label.id)}
              className="ml-2 hover:text-red-300"
            >
              ×
            </button>
          </span>
        </span>
      );
      lastIndex = label.end_offset;
    });

    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end" className="whitespace-pre-wrap">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in text..."
              className="w-64 text-sm focus:outline-none"
            />
          </div>
        </div>
  
        <button 
          onClick={() => onSaveLabels(labels)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          Save Labels
        </button>
      </div>
  
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Text content */}
        <div className="flex-1 overflow-auto p-6">
          <div
            ref={textContainerRef}
            className="min-h-[200px] rounded-lg border bg-white p-4 text-gray-800 shadow-sm"
            onMouseUp={handleTextSelection}
          >
            {renderText()}
          </div>
        </div>
  
        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 border-l bg-white overflow-hidden flex flex-col">
          {showLabelManager ? (
            <LabelTypeManager
              labelTypes={uniqueLabelTypes}
              projectId={numericProjectId}
              onUpdate={async (updatedTypes) => {
                await onLabelTypesUpdate(updatedTypes);
                setShowLabelManager(false);
              }}
            />
          ) : (
            <>
              {/* Header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Labels</h3>
                  <button
                    onClick={() => setShowLabelManager(true)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>
  
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                  {/* Label type buttons */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Label Types</h4>
                    {uniqueLabelTypes.map((labelType) => (
                      <button
                        key={labelType.id}
                        onClick={() => {
                          setSelectedEntityType(labelType.id);
                          if (selectedText) {
                            addLabel(labelType.id);
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                          selectedEntityType === labelType.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: labelType.color }}
                          />
                          {labelType.name}
                        </div>
                        <kbd className="px-2 py-0.5 bg-gray-100 text-xs rounded">
                          {labelType.hotkey}
                        </kbd>
                      </button>
                    ))}
                  </div>
  
                  {/* Search section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Search Labels</h4>
                    <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                      <Search className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={labelSearchQuery}
                        onChange={(e) => setLabelSearchQuery(e.target.value)}
                        placeholder="Search labels..."
                        className="w-full text-sm focus:outline-none"
                      />
                    </div>
                  </div>
  
                  {/* Search options */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Search Options</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={searchOptions.searchAllFiles}
                          onChange={(e) => setSearchOptions(prev => ({
                            ...prev,
                            searchAllFiles: e.target.checked
                          }))}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Search all files</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={searchOptions.regexSearch}
                          onChange={(e) => setSearchOptions(prev => ({
                            ...prev,
                            regexSearch: e.target.checked
                          }))}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Regex search</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={searchOptions.exactMatch}
                          onChange={(e) => setSearchOptions(prev => ({
                            ...prev,
                            exactMatch: e.target.checked
                          }))}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Exact match</span>
                      </label>
                    </div>
                  </div>
  
                  {/* Keyboard shortcuts */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Keyboard Shortcuts</h4>
                    <div className="rounded-md bg-gray-50 p-3 text-sm">
                      <p className="text-gray-500">
                        Select text and press the corresponding hotkey to apply labels:
                      </p>
                      <div className="mt-2 space-y-1">
                        {uniqueLabelTypes.map((type) => (
                          <div key={type.id} className="flex items-center justify-between">
                            <span className="text-gray-700">{type.name}</span>
                            <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                              {type.hotkey}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  
      {/* Modal for label type manager */}
      {showLabelManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-black">Manage Label Types</h3>
              <button 
                onClick={() => setShowLabelManager(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <LabelTypeManager
                labelTypes={uniqueLabelTypes}
                projectId={numericProjectId}
                onUpdate={async (updatedTypes) => {
                  await onLabelTypesUpdate(updatedTypes);
                  setShowLabelManager(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )};

  export default TextLabeler;