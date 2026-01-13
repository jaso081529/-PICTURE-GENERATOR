import React, { useState, useRef, useEffect } from 'react';
import { BRANDS, STYLES, TEMPLATES, SHAPES, PRINT_SIZES } from '../constants';
import { BrandId, GeneratedSticker, StickerTemplate, AspectRatio, LibraryAsset } from '../types';
import BrandCard from './BrandCard';
import { generateStickerImage, analyzeUploadedImage } from '../services/geminiService';
import { Download, Sparkles, Loader2, RefreshCw, ImagePlus, X, Info, Globe, Search, ChevronDown, FileText, FileImage, FileCode, Eye, Maximize2, Wand2, Send, Plus, Pencil, Scissors, ScanEye, History, Trash2, ArrowUpRight, Ratio, FolderOpen, Save, Library, Shapes, CheckCircle, Printer, Layout, Ban } from 'lucide-react';
import { jsPDF } from "jspdf";

const MAX_HISTORY_ITEMS = 12; 
const MAX_LIBRARY_ITEMS_PER_BRAND = 50; 

// Helper to compress images for local storage
const compressImageForStorage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Limit max dimension to 450px to save storage space for more assets (50+)
        const MAX_DIMENSION = 450;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject("Canvas context error");
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 0.6 quality - efficient for storage while keeping details for AI
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const StickerGenerator: React.FC = () => {
  const [selectedBrandId, setSelectedBrandId] = useState<BrandId>(BrandId.RED_DEVILS);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(STYLES[0].id);
  const [selectedShapeId, setSelectedShapeId] = useState<string>(SHAPES[0].id);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  // New state to track selected size label for UI highlighting
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string>(PRINT_SIZES[5].label); // Default Quadrat

  const [prompt, setPrompt] = useState<string>('');
  
  // Reference Images State
  const [referenceImage, setReferenceImage] = useState<string | null>(null); // The manual upload
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set()); // Library selections

  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);

  const [useSearch, setUseSearch] = useState<boolean>(true);
  const [useCutLine, setUseCutLine] = useState<boolean>(false);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [generatedSticker, setGeneratedSticker] = useState<GeneratedSticker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [showSvgPreview, setShowSvgPreview] = useState<boolean>(false);
  const [showZoomModal, setShowZoomModal] = useState<boolean>(false);
  const [showEditInput, setShowEditInput] = useState<boolean>(false);
  const [showPromptInfo, setShowPromptInfo] = useState<boolean>(false);
  const [editPrompt, setEditPrompt] = useState<string>("");

  // History & Library State
  const [history, setHistory] = useState<GeneratedSticker[]>([]);
  const [library, setLibrary] = useState<LibraryAsset[]>([]);
  
  // PRINT QUEUE STATE
  const [printQueue, setPrintQueue] = useState<GeneratedSticker[]>([]);
  const [showPrintStudio, setShowPrintStudio] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const selectedBrand = BRANDS.find(b => b.id === selectedBrandId) || BRANDS[0];
  const selectedStyle = STYLES.find(s => s.id === selectedStyleId) || STYLES[0];
  const selectedShape = SHAPES.find(s => s.id === selectedShapeId) || SHAPES[0];

  // Load history and library on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('sticker_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedLibrary = localStorage.getItem('sticker_library');
      if (savedLibrary) setLibrary(JSON.parse(savedLibrary));
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, []);

  // Clear library selection when brand changes to avoid confusion
  useEffect(() => {
    setSelectedAssetIds(new Set());
  }, [selectedBrandId]);

  const saveToHistory = (newSticker: GeneratedSticker) => {
    setHistory((prev) => {
      const updated = [newSticker, ...prev].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem('sticker_history', JSON.stringify(updated));
      } catch (e) {
        console.warn("LocalStorage quota exceeded.");
      }
      return updated;
    });
  };

  // Library Functions
  const addToLibrary = async (file: File) => {
    try {
        const base64 = await compressImageForStorage(file);
        
        const newAsset: LibraryAsset = {
          id: crypto.randomUUID(),
          brandId: selectedBrandId, // STRICT: Associate only with current brand
          name: file.name,
          imageBase64: base64,
          timestamp: Date.now()
        };
  
        setLibrary((prev) => {
          // Strict Filtering and Limiting
          const brandAssets = prev.filter(a => a.brandId === selectedBrandId);
          const otherAssets = prev.filter(a => a.brandId !== selectedBrandId);
          
          if (brandAssets.length >= MAX_LIBRARY_ITEMS_PER_BRAND) {
              alert(`Bibliothek für ${selectedBrand.name} ist voll (Limit: ${MAX_LIBRARY_ITEMS_PER_BRAND}). Bitte lösche ein altes Asset.`);
              return prev;
          }
  
          const updatedFull = [newAsset, ...brandAssets, ...otherAssets]; // Newest first for this brand
          
          try {
            localStorage.setItem('sticker_library', JSON.stringify(updatedFull));
          } catch (e) {
            alert("Gerätespeicher (Browser Cache) voll! Das Bild konnte nicht gespeichert werden.");
            return prev;
          }
          return updatedFull;
        });
    } catch (err) {
        console.error("Compression failed", err);
        alert("Fehler beim Verarbeiten des Bildes.");
    }
  };

  const deleteLibraryAsset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm("Dieses Asset endgültig aus der Bibliothek löschen?")) return;
    
    // Also remove from selection if present
    if (selectedAssetIds.has(id)) {
        toggleAssetSelection(id);
    }

    setLibrary((prev) => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('sticker_library', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleAssetSelection = (id: string) => {
    setSelectedAssetIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('sticker_history', JSON.stringify(updated));
      return updated;
    });
    // Remove from print queue if deleted
    setPrintQueue(prev => prev.filter(item => item.id !== id));
  };

  const loadHistoryItem = (item: GeneratedSticker) => {
    setGeneratedSticker(item);
    setPrompt(item.prompt.startsWith("Edit:") ? item.prompt.split("(Original:")[0].replace("Edit:", "").trim() : item.prompt);
    setSelectedBrandId(item.brandId);
    if (item.styleId) setSelectedStyleId(item.styleId);
    if (item.shapeId) setSelectedShapeId(item.shapeId);
    if (item.aspectRatio) setAspectRatio(item.aspectRatio);
    if (item.sizeLabel) setSelectedSizeLabel(item.sizeLabel); // Restore size selection
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // We also compress regular uploads slightly to improve performance, though less aggressive than library
        const base64 = await compressImageForStorage(file); 
        setReferenceImage(base64);
        setImageAnalysis(null); 
        
        setIsAnalyzingImage(true);
        try {
          const analysis = await analyzeUploadedImage(base64);
          setImageAnalysis(analysis);
        } catch (err) {
          console.error("Failed to analyze image", err);
        } finally {
          setIsAnalyzingImage(false);
        }
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setImageAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addTemplateToPrompt = (template: StickerTemplate) => {
    setPrompt((prev) => {
      const separator = prev.trim().length > 0 ? ", " : "";
      return prev + separator + template.promptAddition;
    });
  };

  const handleSizeSelection = (size: typeof PRINT_SIZES[0]) => {
     setAspectRatio(size.ratio);
     setSelectedSizeLabel(size.label);
     if (size.shapeId) {
        setSelectedShapeId(size.shapeId);
     }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setSearchStatus(useSearch ? 'Recherchiere Hintergründe & Geo-Daten...' : 'Starte Design...');
    setError(null);
    setGeneratedSticker(null);
    setShowDownloadMenu(false);
    setShowEditInput(false);
    setShowPromptInfo(false);

    try {
      if (useSearch) {
        setTimeout(() => setSearchStatus('Optimiere Design-Prompt...'), 1500);
        setTimeout(() => setSearchStatus('Generiere Premium Aufkleber...'), 3000);
      }
      
      // Merge shape instruction into prompt if it's not the default "contour"
      let effectivePrompt = prompt;
      if (selectedShapeId !== 'contour') {
          effectivePrompt += ` . IMPORTANT: The sticker MUST be in the shape of a ${selectedShape.name}. ${selectedShape.promptInstruction}`;
      }
      
      // Find selected size config to add specific prompt modifiers (e.g. wide layout)
      const currentSize = PRINT_SIZES.find(s => s.label === selectedSizeLabel);
      if (currentSize?.promptAdd) {
         effectivePrompt += ` . LAYOUT INSTRUCTION: ${currentSize.promptAdd}`;
      }

      // Collect all reference images: Manual upload + Selected Library Assets
      const selectedAssets = library.filter(a => selectedAssetIds.has(a.id));
      const referenceImagesArray = selectedAssets.map(a => a.imageBase64);
      if (referenceImage) {
          referenceImagesArray.push(referenceImage);
      }

      const result = await generateStickerImage(
        effectivePrompt, 
        selectedBrand, 
        selectedStyle,
        aspectRatio,
        referenceImagesArray, // Pass array of images
        imageAnalysis || undefined, // Only send text analysis if manual ref image exists (simple logic)
        useSearch,
        false,
        useCutLine
      );
      
      const newSticker: GeneratedSticker = {
        id: crypto.randomUUID(),
        imageUrl: result.imageUrl,
        prompt: prompt,
        enhancedPrompt: result.enhancedPrompt,
        timestamp: Date.now(),
        brandId: selectedBrandId,
        styleId: selectedStyleId,
        shapeId: selectedShapeId,
        aspectRatio: aspectRatio,
        sizeLabel: selectedSizeLabel // Persist the chosen size label
      };

      setGeneratedSticker(newSticker);
      saveToHistory(newSticker);

    } catch (err: any) {
      setError(err.message || "Fehler bei der Generierung. Bitte versuche es erneut.");
    } finally {
      setIsGenerating(false);
      setSearchStatus('');
    }
  };

  const handleEditGenerate = async () => {
    if (!editPrompt.trim() || !generatedSticker) return;

    setIsGenerating(true);
    setSearchStatus('Führe Änderungen durch...');
    setError(null);

    try {
      const result = await generateStickerImage(
        editPrompt, 
        selectedBrand, 
        selectedStyle,
        aspectRatio, 
        [generatedSticker.imageUrl], // Pass existing sticker as reference
        undefined, 
        false, 
        true, 
        useCutLine 
      );
      
      const updatedSticker: GeneratedSticker = {
        ...generatedSticker,
        id: crypto.randomUUID(),
        imageUrl: result.imageUrl,
        prompt: `Edit: ${editPrompt} (Original: ${generatedSticker.prompt})`,
        timestamp: Date.now(),
        styleId: selectedStyleId,
        shapeId: selectedShapeId
      };

      setGeneratedSticker(updatedSticker);
      saveToHistory(updatedSticker);
      setEditPrompt("");
      setShowEditInput(false);

    } catch (err: any) {
      setError(err.message || "Fehler bei der Änderung.");
    } finally {
      setIsGenerating(false);
      setSearchStatus('');
    }
  };

  // --- PRINT STUDIO LOGIC ---

  const togglePrintQueue = (sticker: GeneratedSticker, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrintQueue(prev => {
        const exists = prev.find(s => s.id === sticker.id);
        if (exists) {
            return prev.filter(s => s.id !== sticker.id);
        } else {
            // Open print studio when adding first item
            if (prev.length === 0) setShowPrintStudio(true);
            return [...prev, sticker];
        }
    });
  };

  const generatePrintSheetPDF = (format: 'a4' | 'a3') => {
    if (printQueue.length === 0) return;

    // Dimensions in mm
    const pageWidth = format === 'a4' ? 210 : 297;
    const pageHeight = format === 'a4' ? 297 : 420;
    const margin = 10;
    
    const doc = new jsPDF({
        orientation: format === 'a4' ? 'portrait' : 'portrait', // Usually keep portrait, or auto-detect based on content? Sticking to portrait.
        unit: 'mm',
        format: format
    });

    let currentX = margin;
    let currentY = margin;
    let rowMaxHeight = 0;

    // Helper to parse "9,5 x 9,5 cm" string to mm numbers
    const parseDim = (dimStr: string) => {
        // Remove spaces, replace comma with dot
        const clean = dimStr.replace(/\s/g, '').replace(',', '.');
        // Extract numbers. Matches like "9.5x9.5" or "21.0x29.7" or "⌀9.5"
        const numbers = clean.match(/[\d.]+/g);
        
        if (!numbers) return { w: 100, h: 100 }; // Fallback 10cm

        let w = parseFloat(numbers[0]) * 10; // cm to mm
        let h = w; 
        
        if (numbers.length > 1) {
            h = parseFloat(numbers[1]) * 10;
        }
        
        return { w, h };
    };

    printQueue.forEach((sticker, index) => {
        // Find dimensions based on the stored sizeLabel
        const sizeConfig = PRINT_SIZES.find(s => s.label === sticker.sizeLabel) || PRINT_SIZES[5]; // Default Square if missing
        const { w, h } = parseDim(sizeConfig.dim);

        // Check horizontal fit
        if (currentX + w > pageWidth - margin) {
            // Move to next row
            currentX = margin;
            currentY += rowMaxHeight + 5; // 5mm spacing vertical
            rowMaxHeight = 0;
        }

        // Check vertical fit (New Page)
        if (currentY + h > pageHeight - margin) {
            doc.addPage();
            currentX = margin;
            currentY = margin;
            rowMaxHeight = 0;
        }

        doc.addImage(sticker.imageUrl, 'PNG', currentX, currentY, w, h);
        
        // Draw a light grey cut helper rectangle/circle if desired? 
        // Let's stick to just the image, as the image often has a cut line generated by AI.
        // But we can add a rect for debugging or cutting aid if it's white-on-white.
        doc.setDrawColor(200, 200, 200);
        doc.rect(currentX, currentY, w, h); // Light border to show boundaries

        // Update cursors
        currentX += w + 5; // 5mm spacing horizontal
        if (h > rowMaxHeight) rowMaxHeight = h;
    });

    doc.save(`druckbogen_${format}_${Date.now()}.pdf`);
  };

  const getSvgContent = () => {
    if (!generatedSticker) return '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <image href="${generatedSticker.imageUrl}" width="1024" height="1024" />
</svg>`;
  };

  const downloadFile = async (format: 'png' | 'jpeg' | 'pdf' | 'svg') => {
    if (!generatedSticker) return;
    const filename = `social_media_gen_${generatedSticker.brandId}_${Date.now()}`;
    const link = document.createElement('a');

    if (format === 'png') {
      link.href = generatedSticker.imageUrl;
      link.download = `${filename}.png`;
      link.click();
    } 
    else if (format === 'jpeg') {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.src = generatedSticker.imageUrl;
      await img.decode();
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.download = `${filename}.jpg`;
        link.click();
      }
    }
    else if (format === 'pdf') {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgProps = pdf.getImageProperties(generatedSticker.imageUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const width = pdfWidth - (margin * 2);
      const height = (imgProps.height * width) / imgProps.width;
      pdf.text(`Social Media Bild: ${generatedSticker.brandId}`, margin, margin);
      pdf.addImage(generatedSticker.imageUrl, 'PNG', margin, margin + 10, width, height);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, margin + height + 20);
      pdf.save(`${filename}.pdf`);
    }
    else if (format === 'svg') {
      setShowSvgPreview(true);
      setShowDownloadMenu(false);
      return;
    }
    setShowDownloadMenu(false);
  };

  const performSvgDownload = () => {
    if (!generatedSticker) return;
    const filename = `social_media_gen_${generatedSticker.brandId}_${Date.now()}`;
    const svgContent = getSvgContent();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.svg`;
    link.click();
    setShowSvgPreview(false);
  };

  // STRICT Filter Library for selected Brand
  const brandLibrary = library.filter(asset => asset.brandId === selectedBrandId);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-12 pb-32">
      
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Social Media</span>
          <span className="text-white ml-2">Bild Generator</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Erstelle professionelle Motive für deine Kanäle. 
          Wähle dein Profil, lade optional ein Logo hoch und lass die KI den Rest erledigen.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="space-y-8">
          
          {/* Brand Selection */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-zinc-800 w-8 h-8 flex items-center justify-center rounded-full text-sm">1</span>
              Profil wählen
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BRANDS.map((brand) => (
                <BrandCard 
                  key={brand.id}
                  brand={brand}
                  isSelected={selectedBrandId === brand.id}
                  onClick={() => setSelectedBrandId(brand.id)}
                />
              ))}
            </div>
          </div>

          {/* BRAND LIBRARY SECTION (Persistent & Isolated) */}
          <div className="space-y-3 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 transition-all">
             <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-orange-500" />
                    Bibliothek: <span className="text-white">{selectedBrand.name}</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Klicke Bilder an, um sie ins Design einzufügen.</p>
                </div>
                <span className="text-xs text-zinc-600">{brandLibrary.length} / {MAX_LIBRARY_ITEMS_PER_BRAND}</span>
             </div>
             
             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
                {/* Upload Button */}
                <input 
                  type="file" 
                  ref={libraryInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && addToLibrary(e.target.files[0])}
                />
                <button 
                   onClick={() => libraryInputRef.current?.click()}
                   disabled={brandLibrary.length >= MAX_LIBRARY_ITEMS_PER_BRAND}
                   className="flex-shrink-0 w-20 h-20 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-500 flex flex-col items-center justify-center gap-1 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Neues Asset für dieses Profil speichern"
                >
                   <Plus className="w-6 h-6 text-zinc-500 group-hover:text-white" />
                   <span className="text-[10px] text-zinc-500">Add</span>
                </button>

                {/* Asset Items */}
                {brandLibrary.map(asset => {
                   const isSelected = selectedAssetIds.has(asset.id);
                   return (
                    <div key={asset.id} className="relative flex-shrink-0 w-20 h-20 group">
                        <div 
                            onClick={() => toggleAssetSelection(asset.id)}
                            className={`w-full h-full rounded-lg overflow-hidden cursor-pointer transition-all p-0.5 relative
                                ${isSelected 
                                    ? 'border-2 border-green-500 bg-green-500/10' 
                                    : 'border border-zinc-700 bg-zinc-800 hover:border-zinc-500'
                                }
                            `}
                            title={isSelected ? "Ausgewählt (wird verwendet)" : "Klicken zum Auswählen"}
                        >
                            <img src={asset.imageBase64} alt="Asset" className="w-full h-full object-contain" />
                            
                            {/* Selection Checkmark Overlay */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                                    <CheckCircle className="w-8 h-8 text-green-500 fill-black/50" />
                                </div>
                            )}
                        </div>
                        
                        {/* Delete Button */}
                        <button 
                            onClick={(e) => deleteLibraryAsset(asset.id, e)}
                            className="absolute -top-2 -right-2 p-1 bg-red-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md transform scale-75 z-10"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                   );
                })}

                {brandLibrary.length === 0 && (
                   <div className="flex items-center text-xs text-zinc-600 italic px-2">
                      Leer. Lade Logos hoch!
                   </div>
                )}
             </div>
          </div>

          {/* Style & Format Selection */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-zinc-800 w-8 h-8 flex items-center justify-center rounded-full text-sm">2</span>
              Style & Format
            </h2>
            
            {/* NEW: Print Size / Format Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                {PRINT_SIZES.map((size) => (
                    <button
                        key={size.label}
                        onClick={() => handleSizeSelection(size)}
                        className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5
                            ${selectedSizeLabel === size.label
                                ? 'bg-zinc-700 text-white shadow-md ring-1 ring-zinc-600' 
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                    >
                        <span className="text-xs font-bold">{size.label}</span>
                        <span className="text-[9px] font-normal opacity-70">{size.dim}</span>
                    </button>
                ))}
            </div>

            {/* Shape Selector */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                    <Shapes className="w-3 h-3" /> Form / Cut
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700">
                    {SHAPES.map(shape => (
                        <button
                          key={shape.id}
                          onClick={() => setSelectedShapeId(shape.id)}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2
                            ${selectedShapeId === shape.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                            }
                          `}
                        >
                            <span className="text-sm">{shape.icon}</span>
                            {shape.name.split(' ')[1] || shape.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="flex flex-wrap gap-2">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all text-left flex-grow md:flex-grow-0
                      ${selectedStyleId === style.id 
                        ? 'bg-white text-black shadow-lg shadow-white/20 scale-105' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:border-zinc-500 hover:bg-zinc-700 hover:text-white'
                      }
                    `}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Add Elements / Templates */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-zinc-800 w-8 h-8 flex items-center justify-center rounded-full text-sm">3</span>
              Elemente hinzufügen <span className="text-zinc-500 text-sm font-normal ml-2">(Klicken zum Einfügen)</span>
            </h2>
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
               <div className="flex gap-2 min-w-max">
                 {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => addTemplateToPrompt(tpl)}
                      className="group flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-lg border border-zinc-700 hover:border-zinc-500 transition-all text-sm text-zinc-300 active:scale-95"
                      title={tpl.promptAddition}
                    >
                      <span className="text-lg">{tpl.icon}</span>
                      <span className="font-medium">{tpl.label}</span>
                      <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-green-400" />
                    </button>
                 ))}
               </div>
            </div>
          </div>

          {/* Prompt Input & Reference Image */}
          <div className="space-y-3" id="reference-section">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="bg-zinc-800 w-8 h-8 flex items-center justify-center rounded-full text-sm">4</span>
                Motiv & Referenz
              </h2>
             </div>
            
            <div className="space-y-4">
              {/* Reference Image Upload Area */}
              <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {!referenceImage ? (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border border-dashed border-zinc-700 rounded-xl bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center gap-2 text-sm group"
                  >
                    <ImagePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Einmaligen Upload hinzufügen (Optional)</span>
                  </button>
                ) : (
                  <div className="relative w-full p-3 border border-zinc-700 rounded-xl bg-zinc-900/50 flex items-center gap-4">
                    <div className="w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-600 relative">
                      <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                      {isAnalyzingImage && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                        Bild geladen (Upload)
                        {imageAnalysis && <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><ScanEye className="w-3 h-3"/> Analysiert</span>}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {isAnalyzingImage ? "Analysiere Logo & Details..." : "Wird für die Generierung verwendet"}
                      </p>
                    </div>
                    
                    <button 
                      onClick={removeReferenceImage}
                      className="p-2 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                {/* Summary of Library Selections */}
                {selectedAssetIds.size > 0 && (
                    <div className="mt-2 text-xs text-green-400 flex items-center gap-2 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                        <CheckCircle className="w-4 h-4" />
                        <span>{selectedAssetIds.size} Assets aus der Bibliothek ausgewählt</span>
                    </div>
                )}
              </div>

              {/* Toggles Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Search Toggle */}
                  <button
                    onClick={() => setUseSearch(!useSearch)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      useSearch 
                        ? 'bg-blue-900/20 border-blue-500/50 text-blue-200' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${useSearch ? 'bg-blue-500 text-white' : 'bg-zinc-800'}`}>
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">Smart Web & Maps</div>
                        <div className="text-xs opacity-70">Infos & Geo-Daten</div>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${useSearch ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${useSearch ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>

                  {/* Cut Line Toggle */}
                  <button
                    onClick={() => setUseCutLine(!useCutLine)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      useCutLine 
                        ? 'bg-fuchsia-900/20 border-fuchsia-500/50 text-fuchsia-200' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${useCutLine ? 'bg-fuchsia-500 text-white' : 'bg-zinc-800'}`}>
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">Plotter CutContour</div>
                        <div className="text-xs opacity-70">Magenta Schnittlinie</div>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${useCutLine ? 'bg-fuchsia-500' : 'bg-zinc-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${useCutLine ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="z.B. Karikatur gegen Waldhof Mannheim, ein Teufel der einen blauen Adler jagt..."
                  className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-zinc-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Powered
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all
              ${isGenerating || !prompt.trim() 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {searchStatus || "Generiere Design..."}
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 fill-white" />
                Design Generieren
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-900 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

        </div>

        {/* Output Section */}
        <div className="relative min-h-[500px] bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center p-8 overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ 
                 backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
                 backgroundSize: '24px 24px' 
               }}>
          </div>

          {generatedSticker ? (
            <div className="relative z-10 w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
              <div className="relative group/image max-w-full">
                 <div className="relative bg-zinc-800/50 p-6 rounded-lg shadow-2xl border border-zinc-700/50 group-hover/image:border-zinc-600 transition-colors inline-block">
                    <img 
                      src={generatedSticker.imageUrl} 
                      alt="Generated Sticker" 
                      onClick={() => setShowZoomModal(true)}
                      className="w-auto h-auto max-w-full max-h-[600px] object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] cursor-zoom-in mx-auto"
                    />
                    
                    {/* Image Controls Overlay - Top Right */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover/image:opacity-100 transition-all duration-300 translate-x-2 group-hover/image:translate-x-0">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setShowZoomModal(true); }}
                         className="p-3 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-sm shadow-lg border border-white/10 hover:border-white/30 transition-all"
                         title="Vergrößern (Zoom)"
                       >
                         <Maximize2 className="w-5 h-5" />
                       </button>

                       <button 
                         onClick={(e) => { e.stopPropagation(); setShowPromptInfo(!showPromptInfo); setShowEditInput(false); }}
                         className={`p-3 rounded-full backdrop-blur-sm shadow-lg border transition-all ${showPromptInfo ? 'bg-blue-600 text-white border-blue-400' : 'bg-black/60 hover:bg-black/90 text-white border-white/10 hover:border-white/30'}`}
                         title="Prompt Details & Info"
                       >
                         <Info className="w-5 h-5" />
                       </button>

                       <button 
                         onClick={(e) => { e.stopPropagation(); setShowEditInput(!showEditInput); setShowPromptInfo(false); }}
                         className={`p-3 rounded-full backdrop-blur-sm shadow-lg border transition-all ${showEditInput ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-black/60 hover:bg-black/90 text-white border-white/10 hover:border-white/30'}`}
                         title="Bearbeiten (Edit)"
                       >
                         <Pencil className="w-5 h-5" />
                       </button>
                    </div>

                 </div>

                 {/* Edit Input Overlay - Reveals a mini text field */}
                 {showEditInput && (
                   <div className="absolute -bottom-14 left-0 w-full z-20 animate-in slide-in-from-top-2 fade-in duration-300">
                     <div className="bg-zinc-800 border border-zinc-600 p-2.5 rounded-xl shadow-2xl flex gap-2 items-center ring-1 ring-black/20">
                       <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400">
                          <Wand2 className="w-4 h-4" />
                       </div>
                       <input 
                         type="text" 
                         value={editPrompt}
                         onChange={(e) => setEditPrompt(e.target.value)}
                         placeholder="z.B. Mach die Augen rot..."
                         className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                         autoFocus
                         onKeyDown={(e) => e.key === 'Enter' && handleEditGenerate()}
                       />
                       <button 
                         onClick={handleEditGenerate}
                         disabled={!editPrompt.trim() || isGenerating}
                         className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                       >
                         {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                       </button>
                     </div>
                     <div className="text-center mt-1">
                        <span className="text-[10px] text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded-full">AI Magic Edit Mode</span>
                     </div>
                   </div>
                 )}

                 {/* Info Overlay */}
                 {showPromptInfo && (
                    <div className="absolute top-20 right-[-10px] sm:right-[-120px] md:right-[-20px] w-64 z-20 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="bg-zinc-800/95 backdrop-blur-md border border-zinc-600 p-4 rounded-xl shadow-2xl text-left">
                            <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
                                <Search className="w-3 h-3" />
                                Genutzter Prompt (Enhanced)
                            </h4>
                            <p className="text-xs text-zinc-300 leading-relaxed max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600">
                                {generatedSticker.enhancedPrompt || generatedSticker.prompt}
                            </p>
                        </div>
                    </div>
                 )}
              </div>
              
              <div className="flex flex-col gap-3 w-full max-w-md justify-center mt-8">
                
                {/* Print Sheet Button - ADD TO QUEUE */}
                <button 
                   onClick={() => togglePrintQueue(generatedSticker)}
                   className={`w-full py-2.5 rounded-xl font-medium border flex items-center justify-center gap-2 transition-all 
                     ${printQueue.find(s => s.id === generatedSticker.id)
                       ? 'bg-blue-900/40 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                       : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                     }
                   `}
                >
                   {printQueue.find(s => s.id === generatedSticker.id) ? (
                      <>
                        <Printer className="w-4 h-4" />
                        Auf Druckbogen (Hinzugefügt)
                      </>
                   ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        Auf Druckbogen platzieren
                      </>
                   )}
                </button>

                <div className="flex gap-3 relative w-full">
                  <button 
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="flex-1 px-6 py-3 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                  >
                    <Download className="w-5 h-5" />
                    Download
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <button 
                    onClick={handleGenerate}
                    className="px-4 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-xl font-bold flex items-center justify-center hover:bg-zinc-700 transition-colors"
                    title="Neu Generieren"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {showDownloadMenu && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 z-20">
                      <div className="p-1">
                        <button onClick={() => downloadFile('png')} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-700 rounded-lg text-left transition-colors">
                          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><FileImage className="w-5 h-5" /></div>
                          <div>
                            <div className="font-bold text-white text-sm">PNG (Original)</div>
                            <div className="text-xs text-zinc-400">Transparent, Beste Qualität</div>
                          </div>
                        </button>
                        
                        <button onClick={() => downloadFile('jpeg')} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-700 rounded-lg text-left transition-colors">
                          <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><FileImage className="w-5 h-5" /></div>
                          <div>
                            <div className="font-bold text-white text-sm">JPEG</div>
                            <div className="text-xs text-zinc-400">Weißer Hintergrund, Kompakt</div>
                          </div>
                        </button>

                        <button onClick={() => downloadFile('pdf')} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-700 rounded-lg text-left transition-colors">
                          <div className="bg-red-500/20 p-2 rounded-lg text-red-400"><FileText className="w-5 h-5" /></div>
                          <div>
                            <div className="font-bold text-white text-sm">PDF (Druck)</div>
                            <div className="text-xs text-zinc-400">DIN A4 Blatt Format</div>
                          </div>
                        </button>

                        <button onClick={() => downloadFile('svg')} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-700 rounded-lg text-left transition-colors">
                          <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400"><Eye className="w-5 h-5" /></div>
                          <div>
                            <div className="font-bold text-white text-sm">SVG Vorschau</div>
                            <div className="text-xs text-zinc-400">Struktur prüfen & Download</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Text below if Info overlay is NOT active */}
              {!showPromptInfo && useSearch && generatedSticker.enhancedPrompt && !generatedSticker.prompt.startsWith("Edit:") && (
                 <div className="w-full max-w-md mt-4 text-center">
                    <button 
                        onClick={() => setShowPromptInfo(true)}
                        className="text-xs text-zinc-500 hover:text-blue-400 underline decoration-dotted underline-offset-4 transition-colors"
                    >
                        Zeige Recherche-Details (Prompt)
                    </button>
                 </div>
              )}
            </div>
          ) : (
            <div className="text-center text-zinc-600 z-10">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                <Sparkles className="w-10 h-10 text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dein Design-Bereich</h3>
              <p className="max-w-xs mx-auto">Wähle links dein Profil und beschreibe dein Motiv. Aktiviere "Smart Web & Maps" für Geo-Daten und Analysen.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* History Section */}
      {history.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <h2 className="text-2xl font-bold text-white flex items-center gap-2 border-t border-zinc-800 pt-8 mt-8">
              <History className="w-6 h-6 text-zinc-400" />
              Verlauf / Galerie
              <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-1 rounded ml-2">Lokal Gespeichert (Max {MAX_HISTORY_ITEMS})</span>
           </h2>
           
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((item) => {
                const isInQueue = printQueue.find(s => s.id === item.id);
                return (
                <div key={item.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all hover:shadow-xl">
                    <div className="aspect-square bg-zinc-800 p-2 cursor-pointer" onClick={() => loadHistoryItem(item)}>
                       <img src={item.imageUrl} alt="History Item" className="w-full h-full object-contain" />
                    </div>
                    
                    {/* Size Badge */}
                    <div className="absolute top-2 left-2 pointer-events-none">
                       <span className="text-[9px] font-bold text-zinc-900 bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
                          {item.sizeLabel || "Standard"}
                       </span>
                    </div>

                    {/* Print Selection Checkbox (always visible on hover or if selected) */}
                    <div className={`absolute top-2 right-2 transition-all ${isInQueue ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                            onClick={(e) => togglePrintQueue(item, e)}
                            className={`p-1.5 rounded-full shadow-lg border transition-all ${isInQueue ? 'bg-blue-500 border-blue-400 text-white' : 'bg-black/50 border-white/20 text-zinc-400 hover:bg-black/80 hover:text-white'}`}
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-3 border-t border-zinc-800">
                       <p className="text-xs text-zinc-400 truncate font-medium mb-1">
                        {item.prompt.replace("Edit:", "").trim()}
                       </p>
                       <p className="text-[10px] text-zinc-600 flex justify-between">
                         <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                         <span>{item.brandId}</span>
                       </p>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 top-8 bottom-12 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] pointer-events-none">
                         {/* Visual overlay only, interactions are separate buttons */}
                    </div>
                    <div className="absolute bottom-16 w-full flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => loadHistoryItem(item)}
                            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg"
                            title="Laden & Bearbeiten"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-2 bg-red-900/80 hover:bg-red-600 text-white rounded-full shadow-lg"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                    </div>
                </div>
              )})}
           </div>
        </div>
      )}

      {/* PRINT STUDIO FOOTER PANEL */}
      {printQueue.length > 0 && (
         <div className="fixed bottom-0 left-0 w-full z-40 animate-in slide-in-from-bottom-5">
             {/* Toggle Handle */}
             <div className="flex justify-center -mb-px">
                 <button 
                   onClick={() => setShowPrintStudio(!showPrintStudio)}
                   className="bg-zinc-900 border-t border-l border-r border-zinc-700 text-zinc-300 px-6 py-1.5 rounded-t-xl text-xs font-bold uppercase tracking-wider hover:text-white flex items-center gap-2 shadow-lg"
                 >
                    <Printer className="w-4 h-4" />
                    Druck-Atelier ({printQueue.length})
                    <ChevronDown className={`w-3 h-3 transition-transform ${showPrintStudio ? '' : 'rotate-180'}`} />
                 </button>
             </div>
             
             {/* Main Panel */}
             {showPrintStudio && (
                 <div className="bg-zinc-900/95 backdrop-blur-md border-t border-zinc-700 p-4 md:p-6 shadow-2xl">
                     <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                         
                         {/* Info Area */}
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
                                 <Layout className="w-6 h-6" />
                             </div>
                             <div>
                                 <h3 className="text-white font-bold text-lg">Druckbogen erstellen</h3>
                                 <p className="text-zinc-400 text-xs">
                                     Platziert die {printQueue.length} ausgewählten Motive automatisch platzsparend.
                                     <br />
                                     <span className="text-blue-300">Hinweis: Es werden die original gewählten Größen (z.B. 9,5cm) verwendet.</span>
                                 </p>
                             </div>
                         </div>

                         {/* Actions Area */}
                         <div className="flex gap-3">
                             <button 
                                onClick={() => setPrintQueue([])}
                                className="px-4 py-3 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors font-medium text-sm flex flex-col items-center gap-1"
                             >
                                <Ban className="w-4 h-4" />
                                Leeren
                             </button>

                             <button 
                               onClick={() => generatePrintSheetPDF('a4')}
                               className="px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-all shadow-lg flex flex-col items-center min-w-[120px]"
                             >
                                <span className="text-xs font-normal text-zinc-600">Standard</span>
                                <span className="flex items-center gap-2">DIN A4 <Download className="w-4 h-4" /></span>
                             </button>

                             <button 
                               onClick={() => generatePrintSheetPDF('a3')}
                               className="px-6 py-3 bg-zinc-800 text-white border border-zinc-600 hover:border-zinc-400 hover:bg-zinc-700 rounded-xl font-bold transition-all shadow-lg flex flex-col items-center min-w-[120px]"
                             >
                                <span className="text-xs font-normal text-zinc-400">Großformat</span>
                                <span className="flex items-center gap-2">DIN A3 <Download className="w-4 h-4" /></span>
                             </button>
                         </div>
                     </div>
                 </div>
             )}
         </div>
      )}
      
      {/* Zoom Modal */}
      {showZoomModal && generatedSticker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowZoomModal(false)}>
           <div className="relative w-full h-full flex items-center justify-center p-4">
             <button 
               onClick={() => setShowZoomModal(false)}
               className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-50"
             >
               <X className="w-8 h-8" />
             </button>
             <img 
               src={generatedSticker.imageUrl} 
               alt="Full Size" 
               className="w-auto h-auto max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
               onClick={(e) => e.stopPropagation()} 
             />
           </div>
        </div>
      )}

      {/* SVG Preview Modal */}
      {showSvgPreview && generatedSticker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-3">
                 <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400"><FileCode className="w-6 h-6" /></div>
                 <div>
                    <h3 className="text-xl font-bold text-white">SVG Struktur & Vorschau</h3>
                    <p className="text-xs text-zinc-400">Prüfe die Vektor-Container Struktur vor dem Download</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowSvgPreview(false)}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
              <div className="grid md:grid-cols-2 gap-8 h-full">
                {/* Visual Preview */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Visuelle Vorschau (Gerendert)
                  </h4>
                  <div className="flex-1 min-h-[300px] border border-zinc-700 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center p-4 relative group">
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-zinc-400 font-mono">1024x1024px</div>
                    {/* We render the SVG content directly here to simulate browser rendering */}
                    <div className="w-full max-w-[400px] shadow-2xl" dangerouslySetInnerHTML={{ __html: getSvgContent() }} />
                  </div>
                </div>

                {/* Code Preview */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                    <FileCode className="w-4 h-4" /> XML Quellcode Struktur
                  </h4>
                  <div className="flex-1 min-h-[300px] bg-[#0d0d0d] border border-zinc-800 rounded-xl p-4 font-mono text-xs overflow-auto relative group">
                     <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-[10px]">Read Only</span>
                     </div>
                     <pre className="text-blue-300">
{`<svg `}<span className="text-sky-300">xmlns</span>=<span className="text-green-300">"http://www.w3.org/2000/svg"</span> <span className="text-sky-300">width</span>=<span className="text-green-300">"1024"</span> <span className="text-sky-300">height</span>=<span className="text-green-300">"1024"</span> <span className="text-sky-300">viewBox</span>=<span className="text-green-300">"0 0 1024 1024"</span>{`>
  <!-- Generated by Social Media Bild Generator -->
  <image 
    `}
    <span className="text-sky-300">href</span>=<span className="text-green-300">"data:image/png;base64,..."</span>{` 
    `}
    <span className="text-sky-300">width</span>=<span className="text-green-300">"1024"</span>{` 
    `}
    <span className="text-sky-300">height</span>=<span className="text-green-300">"1024"</span>{` 
  />
</svg>`}
                     </pre>
                  </div>
                  
                  <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex items-start gap-3">
                    <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-orange-300">Wichtiger Hinweis zum Vektor-Format:</p>
                      <p className="text-xs text-orange-200/80">
                        Diese SVG-Datei ist ein <strong>Container</strong>, der das hochauflösende Rasterbild einbettet. Es handelt sich <u>nicht</u> um eine Pfad-Vektorisierung (Tracing). 
                        Für Druckereien ist dies oft ausreichend, um Cut-Contours (Schnittpfade) manuell hinzuzufügen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
               <button 
                 onClick={() => setShowSvgPreview(false)}
                 className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
               >
                 Abbrechen
               </button>
               <button 
                 onClick={performSvgDownload}
                 className="px-5 py-2.5 rounded-lg text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2"
               >
                 <Download className="w-4 h-4" />
                 SVG Datei herunterladen
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerGenerator;