import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Box,
    Grid,
    Input,
    InputLabel,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    CircularProgress,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import { DeclarationStatus, NewPaperData, PageSize, PaperDeclarations, PaperMetadata, SeriesMetadata } from '../../types';
import axios from 'axios';
import getBaseURL from '../../getBaseURL';
import { detectPdfPageSize, getPageSizeName } from '../../utilities/detectPdfPageSize';
import { useSeriesAssets } from '../../hooks/useSeriesAssets';
import {
    generateCoverPageFromSeriesTemplate,
    validateSeriesSettingsForCoverPage
} from '../../utilities/seriesTemplateIntegration';
import {
    DECLARATION_FIELDS,
    declarationsAnswered,
    emptyDeclarations,
    normalizeDeclarations
} from '../../utilities/declarations';

interface PaperFormProps {
    // For create mode
    onSubmit?: (paperData: NewPaperData, contentFile: File, coverPageFile?: File | null) => Promise<void>;
    // For edit mode
    onUpdate?: (paperId: string, paperData: Partial<NewPaperData>, contentFile?: File | null, coverPageFile?: File | null) => Promise<void>;
    isLoading: boolean;
    inModal?: boolean;
    seriesSettings?: SeriesMetadata;
    suggestedPaperNumber?: string | null;
    // Edit mode props
    editMode?: boolean;
    paperId?: string;
    initialData?: PaperMetadata;
}

const PaperForm: React.FC<PaperFormProps> = ({
    onSubmit,
    onUpdate,
    isLoading,
    inModal = false,
    seriesSettings,
    suggestedPaperNumber,
    editMode = false,
    paperId,
    initialData
}) => {
    const [paperData, setPaperData] = useState<NewPaperData>({
        title: '',
        authors: '',
        publicationDate: '',
        paperNumber: '',
        link: '',
        abstract: '',
        keywords: '',
        jel: '',
        declarations: emptyDeclarations()
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [processingPdf, setProcessingPdf] = useState<boolean>(false);

    // Cover page generation state
    const [coverPageFile, setCoverPageFile] = useState<File | null>(null);
    const [generatingCoverPage, setGeneratingCoverPage] = useState<boolean>(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState<boolean>(false);

    // Page size detection state - uses shared PageSize type
    const [detectedPageSize, setDetectedPageSize] = useState<PageSize>('a4');

    // Get series assets for template processing
    const { assets } = useSeriesAssets(seriesSettings?.seriesId || null);

    // Track the data that was used to generate the current cover page
    const [coverPageDataSnapshot, setCoverPageDataSnapshot] = useState<string | null>(null);

    // Helper function to migrate legacy page size formats
    const migrateLegacyPageSize = (legacyPageSize: any): PageSize => {
        // If it's already in the correct format, return as-is
        if (typeof legacyPageSize === 'string') {
            return legacyPageSize as PageSize;
        }

        // Handle legacy object format with width/height numbers and format
        if (legacyPageSize && typeof legacyPageSize === 'object') {
            // Check for legacy format: { width: number, height: number, format: string }
            if (typeof legacyPageSize.width === 'number' && 
                typeof legacyPageSize.height === 'number' && 
                legacyPageSize.format) {
                
                console.log('Migrating legacy page size format:', legacyPageSize);
                
                // Convert based on format or dimensions
                const format = legacyPageSize.format.toLowerCase();
                if (format === 'a4' || (legacyPageSize.width === 595 && legacyPageSize.height === 842)) {
                    return 'a4';
                }
                if (format === 'letter' || (legacyPageSize.width === 612 && legacyPageSize.height === 792)) {
                    return 'letter';
                }
                if (format === 'small' || (legacyPageSize.width === 432 && legacyPageSize.height === 288)) {
                    return 'small';
                }
                
                // Convert to custom format with proper units
                return {
                    width: `${(legacyPageSize.width / 72).toFixed(2)}in`,
                    height: `${(legacyPageSize.height / 72).toFixed(2)}in`
                };
            }

            // Handle new custom format: { width: string, height: string }
            if (typeof legacyPageSize.width === 'string' && 
                typeof legacyPageSize.height === 'string') {
                return legacyPageSize;
            }
        }

        // Default fallback
        console.warn('Unknown page size format, defaulting to A4:', legacyPageSize);
        return 'a4';
    };

    // Validate series settings
    const seriesValidation = validateSeriesSettingsForCoverPage(seriesSettings);

    // Initialize form data for edit mode
    useEffect(() => {
        if (editMode && initialData) {
            // Migrate legacy page size format if needed
            const migratedPageSize = initialData.pageSize ? 
                migrateLegacyPageSize(initialData.pageSize) : 'a4';

            setPaperData({
                title: initialData.title || '',
                authors: Array.isArray(initialData.authors)
                    ? initialData.authors.join(', ')
                    : '',
                publicationDate: initialData.publicationDate ? initialData.publicationDate.slice(0, 10) : '',
                paperNumber: initialData.paperNumber || '',
                link: initialData.link || '',
                abstract: initialData.abstract || '',
                keywords: Array.isArray(initialData.keywords)
                    ? initialData.keywords.join(', ')
                    : '',
                jel: Array.isArray(initialData.jel)
                    ? initialData.jel.join(', ')
                    : '',
                pageSize: migratedPageSize,
                declarations: normalizeDeclarations(initialData.declarations)
            });

            // Set detected page size from migrated data
            if (migratedPageSize) {
                setDetectedPageSize(migratedPageSize);
            }
        }
    }, [editMode, initialData]);

    useEffect(() => {
        if (!editMode && suggestedPaperNumber) {
            setPaperData(prev => prev.paperNumber
                ? prev
                : { ...prev, paperNumber: suggestedPaperNumber }
            );
        }
    }, [editMode, suggestedPaperNumber]);

    // Helper function to create a snapshot of cover page relevant data
    const createDataSnapshot = (data: NewPaperData) => {
        return JSON.stringify({
            title: data.title,
            authors: data.authors,
            publicationDate: data.publicationDate,
            paperNumber: data.paperNumber,
            link: data.link,
            abstract: data.abstract,
            keywords: data.keywords,
            jel: data.jel,
            pageSize: detectedPageSize
        });
    };

    // Check if current form data differs from the data used to generate the cover page
    const isCoverPageStale = () => {
        if (!coverPageFile || !coverPageDataSnapshot) return false;
        const currentSnapshot = createDataSnapshot(paperData);
        return currentSnapshot !== coverPageDataSnapshot;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPaperData(prev => ({ ...prev, [name]: value }));
    };

    const updateDeclaration = (key: keyof PaperDeclarations, patch: { status?: DeclarationStatus; details?: string }) => {
        setPaperData(prev => {
            const current = prev.declarations || emptyDeclarations();
            return {
                ...prev,
                declarations: {
                    ...current,
                    [key]: { ...current[key], ...patch }
                }
            };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // Clear any previous analysis error when a new file is selected
            setAnalysisError(null);

            // Detect page size if it's a PDF
            if (file.type === 'application/pdf') {
                const defaultSize: PageSize = seriesSettings?.coverPageSettings?.defaultPageSize ||
                    initialData?.pageSize ||
                    'a4';

                detectPdfPageSize(file, (pageSize) => {
                    setDetectedPageSize(pageSize);
                    console.log(`Detected PDF page size: ${getPageSizeName(pageSize)}`);
                }, defaultSize);
            }
        }
    };

    // Generate actual PDF for both preview and final use
    const handleGenerateCoverPage = async () => {
        if (!paperData.title || !paperData.authors) {
            setAnalysisError('Title and authors are required to generate a cover page');
            return;
        }

        if (!seriesValidation.valid) {
            setAnalysisError(seriesValidation.error || 'Series settings are invalid');
            return;
        }

        setGeneratingCoverPage(true);
        try {
            // Generate the actual PDF that will be used
            const file = await generateCoverPageFromSeriesTemplate(
                paperData,
                seriesSettings!,
                detectedPageSize,
                assets
            );

            setCoverPageFile(file);

            // Store a snapshot of the data used to generate this cover page
            const dataSnapshot = createDataSnapshot(paperData);
            setCoverPageDataSnapshot(dataSnapshot);

            // Create a preview URL from the same PDF
            const previewUrl = URL.createObjectURL(file);
            setPreviewPdfUrl(previewUrl);

            console.log('Cover page PDF generated successfully:', {
                name: file.name,
                size: file.size,
                type: file.type
            });
        } catch (error) {
            console.error('Error generating cover page:', error);
            setAnalysisError('Failed to generate cover page. Please try again.');
        } finally {
            setGeneratingCoverPage(false);
        }
    };

    // Show the actual PDF preview
    const handleShowPreview = async () => {
        if (previewPdfUrl && !isCoverPageStale()) {
            // We already have a current PDF, show it
            setPreviewOpen(true);
        } else {
            // Generate the PDF first (either new or regenerate stale one)
            if (!paperData.title || !paperData.authors) {
                setAnalysisError('Title and authors are required to generate a preview');
                return;
            }

            if (!seriesValidation.valid) {
                setAnalysisError(seriesValidation.error || 'Series settings are invalid');
                return;
            }

            setGeneratingCoverPage(true);
            try {
                // Generate the PDF for preview
                const file = await generateCoverPageFromSeriesTemplate(
                    paperData,
                    seriesSettings!,
                    detectedPageSize,
                    assets
                );

                // Create preview URL and show it
                const previewUrl = URL.createObjectURL(file);
                setPreviewPdfUrl(previewUrl);
                setPreviewOpen(true);

                // Also store the file for later use
                setCoverPageFile(file);
                
                // Store a snapshot of the data used to generate this cover page
                const dataSnapshot = createDataSnapshot(paperData);
                setCoverPageDataSnapshot(dataSnapshot);
            } catch (error) {
                console.error('Error generating preview:', error);
                setAnalysisError('Failed to generate preview. Please try again.');
            } finally {
                setGeneratingCoverPage(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validation
        if (editMode) {
            // Only consider string fields (pageSize can be an object)
            const hasDataChanges = Object.values(paperData).some(value => typeof value === 'string' && value.trim() !== '');
            const hasFileChanges = selectedFile || coverPageFile;

            if (!hasDataChanges && !hasFileChanges) {
                setAnalysisError('Please make some changes to update the paper');
                return;
            }
        } else {
            if (!selectedFile) {
                setAnalysisError('Please select a content PDF file');
                return;
            }

            // Required on create only, so fixes to historic papers are not blocked.
            if (!declarationsAnswered(paperData.declarations)) {
                setAnalysisError('Please answer the funding, conflicts of interest and ethics approval declarations');
                return;
            }
        }

        try {
            setProcessingPdf(true);

            // Ensure cover page generation completes before proceeding
            let coverPageFileToSubmit = coverPageFile;

            // Generate cover page if we don't have one, or if the current one is stale
            const needsNewCoverPage = !coverPageFileToSubmit || isCoverPageStale();
            
            if (needsNewCoverPage && paperData.title && paperData.authors && seriesValidation.valid) {
                try {
                    console.log(coverPageFileToSubmit ? 'Regenerating stale cover page before submission...' : 'Generating cover page before submission...');
                    setGeneratingCoverPage(true);

                    // Wait for cover page generation to complete
                    coverPageFileToSubmit = await generateCoverPageFromSeriesTemplate(
                        paperData,
                        seriesSettings!,
                        detectedPageSize,
                        assets
                    );

                    setCoverPageFile(coverPageFileToSubmit);
                    
                    // Store a snapshot of the data used to generate this cover page
                    const dataSnapshot = createDataSnapshot(paperData);
                    setCoverPageDataSnapshot(dataSnapshot);
                    
                    console.log('Cover page generated successfully for submission:', {
                        name: coverPageFileToSubmit.name,
                        size: coverPageFileToSubmit.size
                    });
                } catch (error) {
                    console.error('Failed to generate cover page:', error);
                    setAnalysisError('Failed to generate cover page. Proceeding without cover page.');
                    // Continue without cover page rather than failing completely
                } finally {
                    setGeneratingCoverPage(false);
                }
            }

            const enrichedPaperData: NewPaperData | Partial<NewPaperData> = {
                ...paperData,
                pageSize: detectedPageSize
            };

            if (editMode && onUpdate && paperId) {
                console.log('Updating paper with files:', {
                    paperId,
                    hasContentFile: !!selectedFile,
                    contentFileSize: selectedFile?.size,
                    hasCoverPage: !!coverPageFileToSubmit,
                    coverPageSize: coverPageFileToSubmit?.size
                });

                await onUpdate(paperId, enrichedPaperData, selectedFile, coverPageFileToSubmit || null);
            } else if (!editMode && onSubmit && selectedFile) {
                console.log('Creating paper with files:', {
                    hasContentFile: !!selectedFile,
                    contentFileSize: selectedFile?.size,
                    hasCoverPage: !!coverPageFileToSubmit,
                    coverPageSize: coverPageFileToSubmit?.size
                });

                await onSubmit(enrichedPaperData as NewPaperData, selectedFile, coverPageFileToSubmit || null);
            }

            // Reset form if not in modal
            if (!inModal) {
                setPaperData({ title: '', authors: '', publicationDate: '', paperNumber: '', link: '', abstract: '', keywords: '', jel: '', declarations: emptyDeclarations() });
                setSelectedFile(null);
                setCoverPageFile(null);
                setCoverPageDataSnapshot(null);
                if (previewPdfUrl) {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                }
                setDetectedPageSize('a4');
            }
        } catch (error) {
            console.error('Error submitting paper:', error);
            setAnalysisError('Failed to submit paper. Please try again.');
        } finally {
            setProcessingPdf(false);
        }
    };

    const analyzePDF = async () => {
        if (!selectedFile) {
            setAnalysisError('Please select a PDF file first');
            return;
        }

        if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
            setAnalysisError('Selected file must be a PDF');
            return;
        }

        try {
            setAnalyzing(true);
            setAnalysisError(null);

            // Create form data for the file upload
            const formData = new FormData();
            formData.append('pdf', selectedFile);

            // Send the PDF for analysis
            const response = await axios.post(
                getBaseURL('analyze-pdf'),
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                }
            );

            // Process the response data
            const metadata = response.data;

            // Update form fields with extracted data (preserve custom fields like publicationDate/paperNumber/link)
            setPaperData(prev => ({
                ...prev,
                title: metadata.title || '',
                authors: Array.isArray(metadata.authors) ? metadata.authors.join(', ') : '',
                abstract: metadata.abstract || '',
                keywords: Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : '',
                jel: Array.isArray(metadata.jel_classification_codes)
                    ? metadata.jel_classification_codes.map((jel: any) => jel.code).join(', ')
                    : Array.isArray(metadata.jel)
                        ? metadata.jel.join(', ')
                    : ''
            }));

        } catch (error) {
            console.error('Error analyzing PDF:', error);
            setAnalysisError('Failed to analyze PDF. Please try again or fill in the fields manually.');
        } finally {
            setAnalyzing(false);
        }
    };

    // Clean up preview URL when component unmounts
    React.useEffect(() => {
        return () => {
            if (previewPdfUrl) {
                URL.revokeObjectURL(previewPdfUrl);
            }
        };
    }, [previewPdfUrl]);

    const formContent = (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: inModal ? 1 : 0 }}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <FormControl fullWidth margin="normal">
                        <InputLabel htmlFor="upload-file" shrink>
                            {editMode ? 'Replace PDF (optional)' : 'Upload PDF (required)'}
                        </InputLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Input
                                id="upload-file"
                                type="file"
                                inputProps={{ accept: '.pdf' }}
                                onChange={handleFileChange}
                                endAdornment={
                                    <CloudUploadIcon color="action" sx={{ ml: 1 }} />
                                }
                                sx={{ flexGrow: 1 }}
                                required={!editMode}
                            />
                            <Tooltip title="Auto-analyze PDF to extract metadata">
                                <span>
                                    <IconButton
                                        onClick={analyzePDF}
                                        disabled={analyzing || !selectedFile}
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    >
                                        {analyzing ? <CircularProgress size={24} /> : <AutoFixHighIcon />}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                        {selectedFile && (
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Selected file: {selectedFile.name}
                                </Typography>
                                {selectedFile.type === 'application/pdf' && detectedPageSize && (
                                    <Tooltip title="Detected page size will be used for the cover page">
                                        <Paper elevation={0} sx={{
                                            display: 'inline-flex',
                                            px: 1,
                                            py: 0.5,
                                            border: '1px solid',
                                            borderColor: 'primary.light',
                                            borderRadius: 1
                                        }}>
                                            <Typography variant="caption" color="primary">
                                                {getPageSizeName(detectedPageSize)}
                                            </Typography>
                                        </Paper>
                                    </Tooltip>
                                )}
                            </Box>
                        )}
                        {coverPageFile && (
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Cover page generated
                                </Typography>
                                {isCoverPageStale() && (
                                    <Typography variant="caption" color="warning.main">
                                        (Data changed - will regenerate on submit)
                                    </Typography>
                                )}
                            </Box>
                        )}
                        {editMode && initialData?.hasPDF && !selectedFile && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                Current PDF will be kept if no new file is uploaded
                            </Typography>
                        )}
                        {analysisError && (
                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                {analysisError}
                            </Typography>
                        )}
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        id="title"
                        label="Paper Title"
                        name="title"
                        value={paperData.title}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        required
                        fullWidth
                        id="authors"
                        label="Authors (comma-separated)"
                        name="authors"
                        value={paperData.authors}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText="Enter author names separated by commas"
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        id="paperNumber"
                        label="Paper Number"
                        name="paperNumber"
                        value={paperData.paperNumber || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText={suggestedPaperNumber
                            ? `Suggested next number: ${suggestedPaperNumber}. You can override this if needed.`
                            : 'Optional (e.g., 2025-03 or WP-17).'}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        id="link"
                        label="Canonical Link"
                        name="link"
                        value={paperData.link || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText="Optional per-paper landing page URL. If omitted, templates will use the series homepage."
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="publicationDate"
                        label="Publication Date"
                        name="publicationDate"
                        type="date"
                        value={paperData.publicationDate || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        helperText="Optional (YYYY-MM-DD). Used for cover page date and ReDIF Creation-Date."
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="abstract"
                        label="Abstract"
                        name="abstract"
                        value={paperData.abstract}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        multiline
                        rows={4}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="keywords"
                        label="Keywords (comma-separated)"
                        name="keywords"
                        value={paperData.keywords}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText="Enter keywords separated by commas"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="jel"
                        label="JEL Classification Codes (comma-separated)"
                        name="jel"
                        value={paperData.jel}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText="Enter JEL codes separated by commas (e.g., C61, D81)"
                    />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                        Research integrity declarations{editMode ? '' : ' (required)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Required by the Faculty Research Integrity committee for all working papers. Stored with the paper and shown to series members; not published to RePEc.
                    </Typography>
                    {DECLARATION_FIELDS.map(field => {
                        const current = paperData.declarations?.[field.key] || { status: 'not_provided' as DeclarationStatus };
                        return (
                            <Box key={field.key} sx={{ mb: 1.5 }}>
                                <FormControl component="fieldset" size="small">
                                    <FormLabel component="legend" sx={{ fontSize: '0.875rem' }}>
                                        {field.question}
                                    </FormLabel>
                                    <RadioGroup
                                        row
                                        name={`declaration-${field.key}`}
                                        value={current.status === 'not_provided' ? '' : current.status}
                                        onChange={(e) => updateDeclaration(field.key, { status: e.target.value as DeclarationStatus })}
                                    >
                                        <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                                        <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                                    </RadioGroup>
                                </FormControl>
                                {current.status === 'yes' && (
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={field.detailsLabel}
                                        value={current.details || ''}
                                        onChange={(e) => updateDeclaration(field.key, { details: e.target.value })}
                                        multiline
                                        minRows={2}
                                    />
                                )}
                                {editMode && current.status === 'not_provided' && (
                                    <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                                        Not provided yet
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleGenerateCoverPage}
                            disabled={!paperData.title || !paperData.authors || generatingCoverPage || !seriesValidation.valid}
                            startIcon={generatingCoverPage ? <CircularProgress size={18} /> : <FileDownloadIcon />}
                        >
                            {generatingCoverPage ? 'Generating...' : (
                                coverPageFile ? 
                                    (isCoverPageStale() ? 'Regenerate Cover (Data Changed)' : 'Regenerate Cover') : 
                                    'Generate Cover'
                            )}
                        </Button>

                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleShowPreview}
                            disabled={(!paperData.title || !paperData.authors) || generatingCoverPage || !seriesValidation.valid}
                            startIcon={generatingCoverPage ? <CircularProgress size={18} /> : <VisibilityIcon />}
                        >
                            {generatingCoverPage ? 'Generating...' : 'Preview Cover'}
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isLoading || analyzing || processingPdf || (!editMode && !selectedFile)}
                        >
                            {isLoading || processingPdf ?
                                (processingPdf ? 'Processing...' : (editMode ? 'Updating...' : 'Adding Paper...')) :
                                (editMode ? 'Update Paper' : 'Add Paper')}
                        </Button>
                    </Box>

                    {analyzing && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2, verticalAlign: 'middle' }}>
                            Analyzing PDF... This may take a moment.
                        </Typography>
                    )}

                    {processingPdf && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2, verticalAlign: 'middle' }}>
                            {editMode ? 'Updating paper...' : 'Uploading files and merging on server...'} This may take a moment.
                        </Typography>
                    )}

                    {!seriesValidation.valid && (
                        <Typography variant="caption" color="warning.main" sx={{ ml: 2, verticalAlign: 'middle' }}>
                            {seriesValidation.error}. Cover page generation may not work properly.
                        </Typography>
                    )}
                </Grid>
            </Grid>

            {/* Cover Page PDF Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Cover Page Preview (Actual PDF)
                    <IconButton
                        aria-label="close"
                        onClick={() => setPreviewOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {previewPdfUrl ? (
                        <iframe
                            src={previewPdfUrl}
                            title="Cover Page PDF Preview"
                            style={{
                                width: '100%',
                                height: '600px',
                                border: 'none'
                            }}
                        />
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="600px">
                            <CircularProgress />
                            <Typography sx={{ ml: 2 }}>Generating PDF preview...</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Box sx={{ mr: 'auto' }}>
                        <Typography variant="caption" color="text.secondary">
                            Page size: {getPageSizeName(detectedPageSize)} | This is the actual PDF that will be used
                            {assets?.logo && ' | Logo included'}
                            {assets?.footer && ' | Footer image included'}
                            {assets?.background && ' | Background image included'}
                        </Typography>
                    </Box>
                    {previewPdfUrl && (
                        <Button
                            href={previewPdfUrl}
                            download="cover-page.pdf"
                            color="primary"
                        >
                            Download
                        </Button>
                    )}
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

    // If in a modal, just return the form without the card wrapper
    if (inModal) {
        return formContent;
    }

    // Otherwise, wrap in a card for standalone use
    return (
        <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {editMode ? 'Edit Paper' : 'Add New Paper'}
                </Typography>
                {formContent}
            </CardContent>
        </Card>
    );
};

export default PaperForm;
