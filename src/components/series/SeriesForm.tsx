import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Box,
    Grid,
    Alert,
    Collapse,
    Paper,
    InputLabel,
    FormControl,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    SelectChangeEvent,
    FormControlLabel,
    Checkbox,
    Tab,
    Tabs,
    ToggleButton,
    ToggleButtonGroup,
    CircularProgress,
    Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HtmlIcon from '@mui/icons-material/Html';
import { NewSeriesData, SeriesMetadata } from '../../types';
import { validateTemplate, generateTemplatePreview } from '../../utilities/templateManager';
import { getTemplateByType, defaultCustomTemplate } from '../../utilities/templates';
import { generateCoverPageFromSeriesTemplate } from '../../utilities/seriesTemplateIntegration';
import AssetUploader from '../assets/AssetUploader';
import { useSeriesAssets } from '../../hooks/useSeriesAssets';
import { SeriesAsset } from '../../services/assetService';
import { useAccess } from '../../hooks/useAccess';
import { useApiContext } from '../../context/ApiContext';
import { useArchive } from '../../context/ArchiveContext';

interface CoverPageSettings {
    templateId?: string;
    htmlTemplate?: string;
    includeAbstract?: boolean;
    includeJEL?: boolean;
    includeKeywords?: boolean;
    includeInstitution?: boolean;
    includeSeriesName?: boolean;
    includeDate?: boolean;
    headerText?: string;
}

interface SeriesFormProps {
    onSubmit?: (seriesData: NewSeriesData, basePdfFile?: File) => Promise<void>;
    onUpdate?: (seriesId: string, seriesData: Partial<NewSeriesData>) => Promise<void>;
    isLoading: boolean;
    inModal?: boolean;
    editMode?: boolean;
    editingSeriesId?: string;
    initialData?: SeriesMetadata;
    isAdmin?: boolean; // deprecated, use useAccess()
}

const TEMPLATES = [
    { id: 'academic', name: 'Academic Standard', headerText: 'Working Paper', description: 'Standard academic working paper format' },
    { id: 'minimal', name: 'Minimal', headerText: 'Research Paper', description: 'Clean, minimal design with essential information only' },
    { id: 'formal', name: 'Formal', headerText: 'Official Publication', description: 'Formal design suitable for official publications' },
    { id: 'custom', name: 'Custom Template', headerText: 'Custom Template', description: 'Start with a blank template' }
];

const SeriesForm: React.FC<SeriesFormProps> = ({
    onSubmit,
    onUpdate,
    isLoading,
    inModal = false,
    editMode = false,
    editingSeriesId,
    initialData
}) => {
    const [seriesData, setSeriesData] = useState<NewSeriesData>({
        seriesId: '',
        name: '',
        institution: '',
        description: '',
        link: '',
        maintainerName: '',
        maintainerEmail: '',
        maintainerPhone: '',

        // Optional ReDIF-Series fields
        providerInstitutionHandle: '',
        classificationJel: '',
        notification: '',
        providerPhone: '',
        providerPostal: '',
        providerFax: '',
        editorName: '',
        editorEmail: '',
        orderEmail: '',
        orderHomepage: ''
    });

    const [coverPageSettings, setCoverPageSettings] = useState<CoverPageSettings>({
        templateId: 'academic',
        includeAbstract: true,
        includeJEL: true,
        includeKeywords: true,
        includeInstitution: true,
        includeSeriesName: true,
        includeDate: true,
        headerText: 'Working Paper',
        htmlTemplate: getTemplateByType('academic')
    });

    const [htmlTemplate, setHtmlTemplate] = useState<string>(getTemplateByType('academic'));
    const [templateError, setTemplateError] = useState<string | null>(null);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [showRepecAdvanced, setShowRepecAdvanced] = useState(false);
    const [templateTabValue, setTemplateTabValue] = useState(0);
    const [showHtmlEditor, setShowHtmlEditor] = useState(false);

    // Preview
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [previewMode, setPreviewMode] = useState<'html' | 'pdf'>('html');
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Assets
    const { assets, updateAsset, removeAsset } = useSeriesAssets(editingSeriesId || null);

    // Access state
    const [owners, setOwners] = useState<string[]>([]);
    const [editors, setEditors] = useState<string[]>([]);
    const [, setAccessLoading] = useState<boolean>(false);
    const [accessError, setAccessError] = useState<string | null>(null);
    const [newOwnerEmail, setNewOwnerEmail] = useState('');
    const [newEditorEmail, setNewEditorEmail] = useState('');

    const { isAdmin: isAdminUser, ownerOf } = useAccess();
    const isOwnerOfThisSeries = !!(editingSeriesId && ownerOf.includes(editingSeriesId));

    const { apiConfig } = useApiContext();
    const { selectedArchiveId } = useArchive();

    // Advanced ReDIF editor state
    const [redifText, setRedifText] = useState<string>('');
    const [redifLoading, setRedifLoading] = useState<boolean>(false);
    const [redifError, setRedifError] = useState<string | null>(null);
    const [showRedifEditor, setShowRedifEditor] = useState<boolean>(false);

    const pushAccess = async (nextOwners: string[], nextEditors: string[]) => {
        if (!editingSeriesId || !selectedArchiveId) return;
        try {
            setAccessLoading(true);
            setAccessError(null);
            const mod = await import('../../services/accessService');
            await mod.updateSeriesAccess(selectedArchiveId, editingSeriesId, { owners: nextOwners, editors: nextEditors });
        } catch (e: any) {
            setAccessError(e?.message || 'Failed to update access');
        } finally {
            setAccessLoading(false);
        }
    };

    useEffect(() => {
        if (editMode && initialData) {
            setSeriesData({
                seriesId: initialData.seriesId || '',
                name: initialData.name || '',
                institution: initialData.institution || '',
                description: initialData.description || '',
                link: initialData.link || '',
                maintainerName: initialData.maintainerName || '',
                maintainerEmail: initialData.maintainerEmail || '',
                maintainerPhone: initialData.maintainerPhone || '',

                providerInstitutionHandle: initialData.providerInstitutionHandle || '',
                classificationJel: initialData.classificationJel || '',
                notification: initialData.notification || '',
                providerPhone: initialData.providerPhone || '',
                providerPostal: initialData.providerPostal || '',
                providerFax: initialData.providerFax || '',
                editorName: initialData.editorName || '',
                editorEmail: initialData.editorEmail || '',
                orderEmail: initialData.orderEmail || '',
                orderHomepage: initialData.orderHomepage || '',
                coverPageSettings: initialData.coverPageSettings
            });

            const settings = initialData.coverPageSettings;
            if (settings) {
                setCoverPageSettings({
                    templateId: settings.templateId || 'academic',
                    includeAbstract: settings.includeAbstract ?? true,
                    includeJEL: settings.includeJEL ?? true,
                    includeKeywords: settings.includeKeywords ?? true,
                    includeInstitution: settings.includeInstitution ?? true,
                    includeSeriesName: settings.includeSeriesName ?? true,
                    includeDate: settings.includeDate ?? true,
                    headerText: settings.headerText || 'Working Paper',
                    htmlTemplate: settings.htmlTemplate || getTemplateByType('academic')
                });
                if (settings.htmlTemplate) setHtmlTemplate(settings.htmlTemplate);
            }

            const hasAdvancedRepecData = Boolean(
                initialData.providerInstitutionHandle ||
                initialData.classificationJel ||
                initialData.notification ||
                initialData.providerPhone ||
                initialData.providerPostal ||
                initialData.providerFax ||
                initialData.editorName ||
                initialData.editorEmail ||
                initialData.orderEmail ||
                initialData.orderHomepage
            );

            setShowRepecAdvanced(hasAdvancedRepecData);
        } else {
            setShowRepecAdvanced(false);
        }
    }, [editMode, initialData]);

    // Load access for admins/owners
    useEffect(() => {
        const loadAccess = async () => {
            if (!(isAdminUser || isOwnerOfThisSeries) || !editMode || !editingSeriesId || !selectedArchiveId) return;
            try {
                setAccessLoading(true);
                setAccessError(null);
                const mod = await import('../../services/accessService');
                const access = await mod.getSeriesAccess(selectedArchiveId, editingSeriesId);
                setOwners(access.owners || []);
                setEditors(access.editors || []);
            } catch (e: any) {
                setAccessError(e?.message || 'Failed to load access');
            } finally {
                setAccessLoading(false);
            }
        };
        loadAccess();
    }, [isAdminUser, isOwnerOfThisSeries, editMode, editingSeriesId, selectedArchiveId]);

    // Template helpers
    useEffect(() => {
        if (!editMode) {
            const initialTemplateId = coverPageSettings.templateId || 'academic';
            setHtmlTemplate(getTemplateByType(initialTemplateId));
        }
    }, [editMode]);

    useEffect(
        () => () => {
            if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
        },
        [previewPdfUrl]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSeriesData(prev => ({ ...prev, [name]: value }));
    };

    const handleCoverPageSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCoverPageSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleCoverPageCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setCoverPageSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleTemplateChange = (e: SelectChangeEvent) => {
        const templateId = e.target.value;
        const templateHtml = templateId === 'custom' ? defaultCustomTemplate : getTemplateByType(templateId);
        setHtmlTemplate(templateHtml);
        setCoverPageSettings(prev => ({ ...prev, templateId, htmlTemplate: templateHtml }));
        if (templateId === 'custom') setShowHtmlEditor(true);
        const t = TEMPLATES.find(x => x.id === templateId);
        if (t) setCoverPageSettings(prev => ({ ...prev, headerText: t.headerText }));
        validateHtmlTemplate(templateHtml);
    };

    const handleHtmlTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const templateContent = e.target.value;
        setHtmlTemplate(templateContent);
        setCoverPageSettings(prev => ({ ...prev, htmlTemplate: templateContent }));
        validateHtmlTemplate(templateContent);
    };

    const validateHtmlTemplate = (content: string) => {
        if (content.trim()) {
            const validation = validateTemplate(content);
            setTemplateError(validation.valid ? null : `Template validation failed: ${validation.errors.join(', ')}`);
        } else {
            setTemplateError('Template cannot be empty');
        }
    };

    const generatePdfPreview = async (): Promise<string> => {
        try {
            setGeneratingPdf(true);
            const samplePaperData = {
                title: 'Sample Paper Title for Preview',
                authors: 'John Doe, Jane Smith',
                abstract: 'This is a sample abstract to demonstrate how the template will look with data.',
                keywords: 'sample, template, preview, research',
                jel: 'C10, E20'
            };
            const previewSeriesSettings = {
                name: seriesData.name || 'Sample Series Name',
                institution: seriesData.institution || 'Sample Institution',
                link: seriesData.link,
                coverPageSettings: { ...coverPageSettings, htmlTemplate }
            };
            const pageSize = 'a4';
            const pdfFile = await generateCoverPageFromSeriesTemplate(samplePaperData, previewSeriesSettings, pageSize, assets);
            return URL.createObjectURL(pdfFile);
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handlePreviewTemplate = async () => {
        const htmlPreview = generateTemplatePreview(htmlTemplate || defaultCustomTemplate, assets);
        setPreviewHtml(htmlPreview);
        if (previewMode === 'pdf') {
            try {
                if (previewPdfUrl) {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                }
                const pdfUrl = await generatePdfPreview();
                setPreviewPdfUrl(pdfUrl);
            } catch (error) {
                console.error('Failed to generate PDF preview:', error);
                setPreviewMode('html');
                alert('Failed to generate PDF preview. Showing HTML preview instead.');
            }
        }
        setPreviewOpen(true);
    };

    const handlePreviewModeChange = async (_: React.MouseEvent<HTMLElement>, newMode: 'html' | 'pdf' | null) => {
        if (newMode === null) return;
        setPreviewMode(newMode);
        if (newMode === 'pdf' && previewHtml && !previewPdfUrl) {
            try {
                setPreviewPdfUrl(await generatePdfPreview());
            } catch {
                setPreviewMode('html');
            }
        }
    };

    const handlePreviewClose = () => {
        setPreviewOpen(false);
        if (previewPdfUrl) {
            URL.revokeObjectURL(previewPdfUrl);
            setPreviewPdfUrl(null);
        }
    };

    const handleTemplateTabChange = (_: React.SyntheticEvent, newValue: number) => setTemplateTabValue(newValue);

    const toggleHtmlEditor = () => {
        setShowHtmlEditor(!showHtmlEditor);
        if (!showHtmlEditor && templateTabValue !== 0) setTemplateTabValue(0);
    };

    const handleAssetChange = (type: 'logo' | 'header' | 'footer' | 'background', asset: SeriesAsset | null) => {
        if (asset) updateAsset(type, asset);
        else removeAsset(type);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData: NewSeriesData | Partial<NewSeriesData> = {
            ...seriesData,
            coverPageSettings: { ...coverPageSettings, htmlTemplate }
        };
        try {
            if (editMode && onUpdate && editingSeriesId) {
                await onUpdate(editingSeriesId, formData);
            } else if (!editMode && onSubmit) {
                await onSubmit(formData as NewSeriesData);
            }
            if (!inModal) {
                setSeriesData({
                    seriesId: '',
                    name: '',
                    institution: '',
                    description: '',
                    link: '',
                    maintainerName: '',
                    maintainerEmail: '',
                    maintainerPhone: '',

                    providerInstitutionHandle: '',
                    classificationJel: '',
                    notification: '',
                    providerPhone: '',
                    providerPostal: '',
                    providerFax: '',
                    editorName: '',
                    editorEmail: '',
                    orderEmail: '',
                    orderHomepage: ''
                });
                setCoverPageSettings({
                    templateId: 'academic',
                    includeAbstract: true,
                    includeJEL: true,
                    includeKeywords: true,
                    includeInstitution: true,
                    includeSeriesName: true,
                    includeDate: true,
                    headerText: 'Working Paper',
                    htmlTemplate: getTemplateByType('academic')
                });
                setHtmlTemplate(getTemplateByType('academic'));
            }
        } catch (error) {
            /* parent handles */
        }
    };

    const handleToggleRedifEditor = async () => {
        if (!editMode || !editingSeriesId || !selectedArchiveId) return;

        const next = !showRedifEditor;
        setShowRedifEditor(next);

        if (next && !redifText && !redifLoading) {
            try {
                setRedifLoading(true);
                setRedifError(null);
                const mod = await import('../../services/seriesService');
                const text = await mod.getSeriesRedif(apiConfig.key, selectedArchiveId, editingSeriesId);
                setRedifText(text);
            } catch (e: any) {
                const msg = e?.response?.data?.error || e?.message || 'Failed to load ReDIF';
                setRedifError(msg);
            } finally {
                setRedifLoading(false);
            }
        }
    };

    const handleSaveRedif = async () => {
        if (!editMode || !editingSeriesId || !selectedArchiveId) return;
        try {
            setRedifLoading(true);
            setRedifError(null);
            const mod = await import('../../services/seriesService');
            const updated = await mod.updateSeriesRedif(apiConfig.key, selectedArchiveId, editingSeriesId, redifText);

            // Keep local form fields in sync with what the server derived
            setSeriesData(prev => ({
                ...prev,
                name: updated.name || prev.name,
                institution: updated.institution || prev.institution,
                description: updated.description ?? prev.description,
                link: updated.link ?? prev.link,
                maintainerName: updated.maintainerName ?? prev.maintainerName,
                maintainerEmail: updated.maintainerEmail ?? prev.maintainerEmail,
                maintainerPhone: updated.maintainerPhone ?? prev.maintainerPhone
            }));
        } catch (e: any) {
            const msg = e?.response?.data?.error || e?.message || 'Failed to save ReDIF';
            setRedifError(msg);
        } finally {
            setRedifLoading(false);
        }
    };

    const formContent = (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: inModal ? 1 : 0 }}>
            <Grid container spacing={2}>
                <Grid item xs={12}><Typography variant="h6" gutterBottom>Series Information</Typography></Grid>

                <Grid item xs={12}>
                    <TextField required fullWidth id="seriesId" label="Series ID" name="seriesId" value={seriesData.seriesId} onChange={handleChange} variant="outlined" size="small" margin="normal" disabled={!!editingSeriesId || editMode} />
                </Grid>
                <Grid item xs={12}>
                    <TextField required fullWidth id="name" label="Series Name" name="name" value={seriesData.name} onChange={handleChange} variant="outlined" size="small" margin="normal" />
                </Grid>
                <Grid item xs={12}>
                    <TextField required fullWidth id="institution" label="Institution" name="institution" value={seriesData.institution} onChange={handleChange} variant="outlined" size="small" margin="normal" />
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth id="description" label="Description" name="description" value={seriesData.description || ''} onChange={handleChange} variant="outlined" size="small" margin="normal" multiline rows={2} helperText="Optional description of the series" />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        id="link"
                        label="Series homepage URL"
                        name="link"
                        value={seriesData.link || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText="Homepage of the organisation or series (used on cover pages and in metadata)."
                    />
                </Grid>

                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">RePEc maintainer (optional)</Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        id="maintainerName"
                        label="Maintainer name"
                        name="maintainerName"
                        value={seriesData.maintainerName || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText="Optional override for the published ReDIF series template (if blank, archive default is used)."
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        id="maintainerEmail"
                        label="Maintainer email"
                        name="maintainerEmail"
                        value={seriesData.maintainerEmail || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText="Optional override for the published ReDIF series template (if blank, archive default is used)."
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        id="maintainerPhone"
                        label="Maintainer phone"
                        name="maintainerPhone"
                        value={seriesData.maintainerPhone || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        helperText="Optional override for the published ReDIF series template (if blank, archive default is used)."
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => setShowRepecAdvanced(v => !v)}
                        sx={{ mt: 0.5 }}
                    >
                        {showRepecAdvanced ? 'Hide RePEc advanced metadata' : 'Show RePEc advanced metadata'}
                    </Button>
                </Grid>

                <Collapse in={showRepecAdvanced} sx={{ width: '100%' }}>
                    <Grid container spacing={2} sx={{ pl: 2, pr: 2, mt: 0.5 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                                ReDIF-Series fields (optional)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                These fields are published into the RePEc series template (inside <code>*seri.rdf</code>).
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="providerInstitutionHandle"
                                label="Provider-Institution (RePEc handle)"
                                name="providerInstitutionHandle"
                                value={seriesData.providerInstitutionHandle || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                                placeholder="RePEc:edi:xxxxxx"
                                helperText="Optional. Example: RePEc:edi:dxmonau"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="classificationJel"
                                label="Classification-JEL"
                                name="classificationJel"
                                value={seriesData.classificationJel || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                                placeholder="e.g. C10, E20"
                                helperText="Optional. Comma-separated JEL codes (series-level)."
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="notification"
                                label="Notification"
                                name="notification"
                                value={seriesData.notification || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                                helperText="Optional. RePEc Notification field (if your archive uses it)."
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                id="providerPhone"
                                label="Provider-Phone"
                                name="providerPhone"
                                value={seriesData.providerPhone || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                id="providerFax"
                                label="Provider-Fax"
                                name="providerFax"
                                value={seriesData.providerFax || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                id="providerPostal"
                                label="Provider-Postal"
                                name="providerPostal"
                                value={seriesData.providerPostal || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                                helperText="Optional. You can use multiple lines."
                                multiline
                                minRows={2}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="editorName"
                                label="Editor-Name"
                                name="editorName"
                                value={seriesData.editorName || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="editorEmail"
                                label="Editor-Email"
                                name="editorEmail"
                                value={seriesData.editorEmail || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="orderEmail"
                                label="Order-Email"
                                name="orderEmail"
                                value={seriesData.orderEmail || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="orderHomepage"
                                label="Order-Homepage"
                                name="orderHomepage"
                                value={seriesData.orderHomepage || ''}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                margin="normal"
                            />
                        </Grid>
                    </Grid>
                </Collapse>

                {(editingSeriesId || !inModal) && (
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Divider />
                        <Typography variant="h6" sx={{ my: 2 }}>Series Assets</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Upload images to be used in your cover page templates. Images will be automatically resized and optimized.</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}><AssetUploader seriesId={editingSeriesId || seriesData.seriesId} type="logo" currentAsset={assets?.logo} onAssetChange={(asset) => handleAssetChange('logo', asset)} disabled={!editingSeriesId && !seriesData.seriesId} /></Grid>
                            <Grid item xs={12} md={3}><AssetUploader seriesId={editingSeriesId || seriesData.seriesId} type="header" currentAsset={assets?.header} onAssetChange={(asset) => handleAssetChange('header', asset)} disabled={!editingSeriesId && !seriesData.seriesId} /></Grid>
                            <Grid item xs={12} md={3}><AssetUploader seriesId={editingSeriesId || seriesData.seriesId} type="footer" currentAsset={assets?.footer} onAssetChange={(asset) => handleAssetChange('footer', asset)} disabled={!editingSeriesId && !seriesData.seriesId} /></Grid>
                            <Grid item xs={12} md={3}><AssetUploader seriesId={editingSeriesId || seriesData.seriesId} type="background" currentAsset={assets?.background} onAssetChange={(asset) => handleAssetChange('background', asset)} disabled={!editingSeriesId && !seriesData.seriesId} /></Grid>
                        </Grid>
                    </Grid>
                )}

                <Grid item xs={12} sx={{ mt: 2 }}>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
                        <Typography variant="h6">Cover Page Settings</Typography>
                        <Button variant="outlined" size="small" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}>{showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}</Button>
                    </Box>
                </Grid>

                <Collapse in={showAdvancedSettings} sx={{ width: '100%' }}>
                    <Grid container spacing={2} sx={{ pl: 2, pr: 2, mt: 1 }}>
                        <Grid item xs={12}><Typography variant="subtitle2" gutterBottom>Content to Include on Cover Pages</Typography></Grid>
                        <Grid item xs={12} sm={6} md={4}><FormControlLabel control={<Checkbox checked={coverPageSettings.includeAbstract ?? true} onChange={handleCoverPageCheckboxChange} name="includeAbstract" />} label="Include Abstract" /></Grid>
                        <Grid item xs={12} sm={6} md={4}><FormControlLabel control={<Checkbox checked={coverPageSettings.includeJEL ?? true} onChange={handleCoverPageCheckboxChange} name="includeJEL" />} label="Include JEL Codes" /></Grid>
                        <Grid item xs={12} sm={6} md={4}><FormControlLabel control={<Checkbox checked={coverPageSettings.includeKeywords ?? true} onChange={handleCoverPageCheckboxChange} name="includeKeywords" />} label="Include Keywords" /></Grid>
                        <Grid item xs={12} sm={6} md={4}><FormControlLabel control={<Checkbox checked={coverPageSettings.includeInstitution ?? true} onChange={handleCoverPageCheckboxChange} name="includeInstitution" />} label="Include Institution" /></Grid>
                        <Grid item xs={12} sm={6} md={4}><FormControlLabel control={<Checkbox checked={coverPageSettings.includeSeriesName ?? true} onChange={handleCoverPageCheckboxChange} name="includeSeriesName" />} label="Include Series Name" /></Grid>
                        <Grid item xs={12} sm={6} md={4}><FormControlLabel control={<Checkbox checked={coverPageSettings.includeDate ?? true} onChange={handleCoverPageCheckboxChange} name="includeDate" />} label="Include Date" /></Grid>
                    </Grid>
                </Collapse>

                <Grid item xs={12}>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="default-template-select">Template Style</InputLabel>
                        <Select labelId="default-template-select" id="template-select" value={coverPageSettings.templateId || 'academic'} label="Template Style" onChange={handleTemplateChange} size="small">
                            {TEMPLATES.map(template => (<MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary">{TEMPLATES.find(t => t.id === coverPageSettings.templateId)?.description}</Typography>
                </Grid>

                <Grid item xs={12}>
                    <TextField fullWidth id="headerText" label="Header Text" name="headerText" value={coverPageSettings.headerText || ''} onChange={handleCoverPageSettingChange} variant="outlined" size="small" margin="normal" helperText="Text that appears at the top of the cover page" />
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="subtitle1">HTML Template</Typography>
                        <Box>
                            <Button variant="outlined" startIcon={<CodeIcon />} onClick={toggleHtmlEditor} size="small" sx={{ mr: 1 }}>{showHtmlEditor ? 'Hide HTML Editor' : 'Edit HTML'}</Button>
                            <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={handlePreviewTemplate} disabled={!htmlTemplate || generatingPdf} size="small">{generatingPdf ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}Preview</Button>
                        </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">The template will be filled with paper details when generating cover pages. Preview uses sample data.</Typography>
                    <Collapse in={showHtmlEditor}>
                        <Paper elevation={1} sx={{ p: 2, mt: 2, border: templateError ? '1px solid #f44336' : 'none' }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                <Tabs value={templateTabValue} onChange={handleTemplateTabChange}>
                                    <Tab label="Edit Template" />
                                    <Tab label="Help" />
                                </Tabs>
                            </Box>
                            {templateTabValue === 0 && (
                                <TextField fullWidth multiline rows={10} value={htmlTemplate} onChange={handleHtmlTemplateChange} variant="outlined" size="small" placeholder="Paste or edit your HTML template here" sx={{ fontFamily: 'monospace', '& .MuiInputBase-input': { fontFamily: 'monospace' } }} />
                            )}
                            {templateTabValue === 1 && (
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>Available Template Variables (Handlebars syntax):</Typography>
                                    <Typography variant="body2" component="div">
                                        <ul>
                                            <li><code>{'{{title}}'}</code> - Paper title</li>
                                            <li><code>{'{{authors}}'}</code> - Comma-separated list of authors</li>
                                            <li><code>{'{{abstract}}'}</code> - Paper abstract</li>
                                            <li><code>{'{{institution}}'}</code> - Institution name</li>
                                            <li><code>{'{{seriesName}}'}</code> - Series name</li>
                                            <li><code>{'{{date}}'}</code> - Publication date (or today if not set)</li>
                                            <li><code>{'{{year}}'}</code> - Year derived from publication date (or current year)</li>
                                            <li><code>{'{{keywords}}'}</code> - Comma-separated keywords</li>
                                            <li><code>{'{{jel}}'}</code> - JEL classification codes</li>
                                            <li><code>{'{{headerText}}'}</code> - Header text (e.g., "Working Paper")</li>
                                            <li><code>{'{{logoUrl}}'}</code> - URL to uploaded logo image</li>
                                            <li><code>{'{{headerImageUrl}}'}</code> - URL to uploaded header image</li>
                                            <li><code>{'{{headerImageURL}}'}</code> - Alias of <code>{'{{headerImageUrl}}'}</code></li>
                                            <li><code>{'{{footerImageUrl}}'}</code> - URL to uploaded footer image</li>
                                            <li><code>{'{{footerImageURL}}'}</code> - Alias of <code>{'{{footerImageUrl}}'}</code></li>
                                            <li><code>{'{{backgroundImageUrl}}'}</code> - URL to uploaded background image</li>
                                            <li><code>{'{{backgroundImageURL}}'}</code> - Alias of <code>{'{{backgroundImageUrl}}'}</code></li>
                                            <li><code>{'{{paperNumber}}'}</code> - Paper number/identifier</li>
                                            <li><code>{'{{link}}'}</code> - Canonical paper link if set, otherwise the series homepage URL</li>
                                        </ul>
                                    </Typography>
                                </Box>
                            )}
                            {templateError && (<Alert severity="error" sx={{ mt: 2 }}>{templateError}</Alert>)}
                        </Paper>
                    </Collapse>
                </Grid>

                {editMode && editingSeriesId && (
                    <Grid item xs={12} sx={{ mt: 4 }}>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
                            <Box>
                                <Typography variant="h6">ReDIF (advanced)</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Edit the ReDIF series template that is published inside the archive-level file (e.g., <code>aaa</code><code>seri.rdf</code>).
                                    Changing the series handle or type is not allowed and will error. Maintainer and Provider fields are supported.
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CodeIcon />}
                                onClick={handleToggleRedifEditor}
                                disabled={redifLoading}
                            >
                                {showRedifEditor ? 'Hide ReDIF' : 'Edit ReDIF'}
                            </Button>
                        </Box>
                        <Collapse in={showRedifEditor}>
                            <Paper elevation={1} sx={{ p: 2, mt: 1 }}>
                                {redifError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {redifError}
                                    </Alert>
                                )}
                                {redifLoading && !redifText ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress size={24} sx={{ mr: 2 }} />
                                        <Typography variant="body2" color="text.secondary">Loading ReDIF...</Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={10}
                                            value={redifText}
                                            onChange={(e) => setRedifText(e.target.value)}
                                            variant="outlined"
                                            size="small"
                                            placeholder="Template-Type: ReDIF-Series 1.0\nName: ...\nProvider-Name: ...\nMaintainer-Email: ...\n..."
                                            sx={{
                                                fontFamily: 'monospace',
                                                '& .MuiInputBase-input': { fontFamily: 'monospace' }
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                JSON metadata remains the source of truth; supported ReDIF fields are parsed back into it when you save.
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={handleSaveRedif}
                                                disabled={redifLoading || !redifText.trim()}
                                            >
                                                {redifLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                                                Save ReDIF
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Paper>
                        </Collapse>
                    </Grid>
                )}

                <Grid item xs={12}>
                    <Button type="submit" variant="contained" color="primary" disabled={isLoading || !!templateError} sx={{ mt: 2 }}>
                        {isLoading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Series' : 'Create Series')}
                    </Button>
                </Grid>

                {(editMode && (isAdminUser || isOwnerOfThisSeries)) && (
                    <Grid item xs={12} sx={{ mt: 4 }}>
                        <Divider />
                        <Typography variant="h6" sx={{ my: 2 }}>Access Control {isAdminUser ? '(Admin)' : '(Series Owner)'}</Typography>
                        {accessError && (<Alert severity="error" sx={{ mb: 2 }}>{accessError}</Alert>)}
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom>Series Owners</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField fullWidth size="small" placeholder="owner@example.edu" value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} />
                                    <Button variant="outlined" onClick={() => {
                                        const v = newOwnerEmail.trim().toLowerCase();
                                        if (v && !owners.includes(v)) {
                                            const nextOwners = [...owners, v];
                                            setOwners(nextOwners);
                                            pushAccess(nextOwners, editors);
                                        }
                                        setNewOwnerEmail('');
                                    }}>Add</Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {owners.map(email => (
                                        <Chip key={email} label={email} onDelete={() => {
                                            const nextOwners = owners.filter(e => e !== email);
                                            setOwners(nextOwners);
                                            pushAccess(nextOwners, editors);
                                        }} />
                                    ))}
                                    {owners.length === 0 && (<Typography variant="caption" color="text.secondary">No owners assigned</Typography>)}
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom>Editors</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField fullWidth size="small" placeholder="editor@example.edu" value={newEditorEmail} onChange={(e) => setNewEditorEmail(e.target.value)} />
                                    <Button variant="outlined" onClick={() => {
                                        const v = newEditorEmail.trim().toLowerCase();
                                        if (v && !editors.includes(v)) {
                                            const nextEditors = [...editors, v];
                                            setEditors(nextEditors);
                                            pushAccess(owners, nextEditors);
                                        }
                                        setNewEditorEmail('');
                                    }}>Add</Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {editors.map(email => (
                                        <Chip key={email} label={email} onDelete={() => {
                                            const nextEditors = editors.filter(e => e !== email);
                                            setEditors(nextEditors);
                                            pushAccess(owners, nextEditors);
                                        }} />
                                    ))}
                                    {editors.length === 0 && (<Typography variant="caption" color="text.secondary">No editors assigned</Typography>)}
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                )}
            </Grid>

            {/* Template Preview Dialog */}
            <Dialog open={previewOpen} onClose={handlePreviewClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Template Preview</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ToggleButtonGroup value={previewMode} exclusive onChange={handlePreviewModeChange} size="small" disabled={generatingPdf}>
                                <ToggleButton value="html" aria-label="HTML preview">
                                    <HtmlIcon sx={{ mr: 1 }} /> HTML
                                </ToggleButton>
                                <ToggleButton value="pdf" aria-label="PDF preview">
                                    <PictureAsPdfIcon sx={{ mr: 1 }} /> PDF
                                </ToggleButton>
                            </ToggleButtonGroup>
                            <IconButton aria-label="close" onClick={handlePreviewClose} sx={{ color: (theme) => theme.palette.grey[500] }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {generatingPdf && previewMode === 'pdf' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <CircularProgress size={40} sx={{ mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">Generating PDF preview using server-side rendering...</Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Paper elevation={0} sx={{ p: 0, height: '600px', overflow: 'auto', border: '1px solid #ddd', '& iframe': { border: 'none', width: '100%', height: '100%' } }}>
                            {previewMode === 'html' ? (
                                <iframe srcDoc={previewHtml} title="Template Preview" sandbox="allow-same-origin" />
                            ) : previewPdfUrl ? (
                                <iframe src={previewPdfUrl} title="PDF Preview" />
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Typography variant="body2" color="text.secondary">PDF preview not available</Typography>
                                </Box>
                            )}
                        </Paper>
                    )}
                </DialogContent>
                <DialogActions>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
                        {previewMode === 'html' ? 'HTML preview shows the template structure and styling' : 'PDF preview shows how the template will appear when generated as a cover page (using sample data)'}
                    </Typography>
                    {previewPdfUrl && previewMode === 'pdf' && (
                        <Button href={previewPdfUrl} download="template-preview.pdf" color="primary">Download</Button>
                    )}
                    <Button onClick={handlePreviewClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

    if (inModal) return formContent;

    return (
        <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>{editMode ? 'Edit Series' : 'Create New Series'}</Typography>
                {formContent}
            </CardContent>
        </Card>
    );
};

export default SeriesForm;
