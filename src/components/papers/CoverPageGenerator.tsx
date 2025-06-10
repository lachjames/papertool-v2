import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
    pdf,
    Font
} from '@react-pdf/renderer';
import { PageSize as AppPageSize } from '../../types';
import { PageSize as ReactPdfPageSize } from '@react-pdf/types';
import { toReactPdfPageSize, getOrientation } from '../../utilities/pdfSizeUtils';

// Optional: Register fonts for better typography
// Font.register({
//   family: 'Times-Roman',
//   src: '/fonts/times-roman.ttf'
// });

// Styles for the PDF document
const styles = StyleSheet.create({
    page: {
        padding: 50,
        backgroundColor: '#FFFFFF',
    },
    header: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#333333',
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#CCCCCC',
        borderBottomStyle: 'solid',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        marginBottom: 24,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    authors: {
        fontSize: 12,
        marginBottom: 20,
        textAlign: 'center',
    },
    institution: {
        fontSize: 12,
        marginBottom: 12,
        textAlign: 'center',
    },
    seriesName: {
        fontSize: 12,
        marginBottom: 12,
        textAlign: 'center',
    },
    date: {
        fontSize: 10,
        marginBottom: 30,
        textAlign: 'right',
    },
    abstractTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    abstract: {
        fontSize: 10,
        marginBottom: 20,
        textAlign: 'justify',
    },
    metadata: {
        fontSize: 10,
        marginBottom: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        borderTopStyle: 'solid',
    },
});

// PDF Document component
interface CoverPageDocumentProps {
    paperData: {
        title: string;
        authors: string;
        abstract: string;
        keywords: string;
        jel?: string;
    };
    seriesSettings: {
        name: string;
        institution: string;
        coverPageSettings?: {
            headerText?: string;
        };
    };
    pageSize: AppPageSize;
}

const CoverPageDocument: React.FC<CoverPageDocumentProps> = ({
    paperData,
    seriesSettings,
    pageSize
}) => {
    // Parse data
    const authorsList = paperData.authors.split(',').map(a => a.trim()).filter(a => a);
    const keywordsList = paperData.keywords.split(',').map(k => k.trim()).filter(k => k);
    const jelList = paperData.jel ? paperData.jel.split(',').map(j => j.trim()).filter(j => j) : [];

    // Convert our PageSize to React-PDF compatible format
    const pdfSize: ReactPdfPageSize = toReactPdfPageSize(pageSize);
    const orientation = getOrientation(pageSize);

    return (
        <Document>
            <Page
                size={pdfSize}
                orientation={orientation}
                style={styles.page}
            >
                <Text style={styles.header}>
                    {seriesSettings?.coverPageSettings?.headerText || 'Working Paper'}
                </Text>

                <View style={styles.divider} />

                {seriesSettings?.name && (
                    <Text style={styles.seriesName}>{seriesSettings.name}</Text>
                )}

                <Text style={styles.title}>{paperData.title}</Text>

                <Text style={styles.authors}>
                    {authorsList.join(', ')}
                </Text>

                {seriesSettings?.institution && (
                    <Text style={styles.institution}>{seriesSettings.institution}</Text>
                )}

                <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>

                {paperData.abstract && (
                    <View>
                        <Text style={styles.abstractTitle}>Abstract</Text>
                        <Text style={styles.abstract}>{paperData.abstract}</Text>
                    </View>
                )}

                {keywordsList.length > 0 && (
                    <Text style={styles.metadata}>
                        <Text style={{ fontWeight: 'bold' }}>Keywords: </Text>
                        {keywordsList.join(', ')}
                    </Text>
                )}

                {jelList.length > 0 && (
                    <Text style={styles.metadata}>
                        <Text style={{ fontWeight: 'bold' }}>JEL Classification: </Text>
                        {jelList.join(', ')}
                    </Text>
                )}

                <Text style={styles.footer}>Page 1</Text>
            </Page>
        </Document>
    );
};

// Utility functions for using the cover page generator
interface CoverPageGeneratorProps {
    paperData: {
        title: string;
        authors: string;
        abstract: string;
        keywords: string;
        jel?: string;
    };
    seriesSettings: {
        name: string;
        institution: string;
        coverPageSettings?: {
            headerText?: string;
            defaultPageSize?: AppPageSize;
        };
    };
    pageSize: AppPageSize;
}

// Hook to generate PDFs
export const useCoverPageGenerator = ({
    paperData,
    seriesSettings,
    pageSize
}: CoverPageGeneratorProps) => {

    // Generate PDF blob
    const generatePdfBlob = async (): Promise<Blob> => {
        try {
            console.log(`Generating PDF with pageSize: ${pageSize.width}×${pageSize.height} (${pageSize.format || 'custom'})`);

            const pdfBlob = await pdf(
                <CoverPageDocument
                    paperData={paperData}
                    seriesSettings={seriesSettings}
                    pageSize={pageSize}
                />
            ).toBlob();

            return pdfBlob;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    };

    // Generate PDF as file
    const generatePdfFile = async (): Promise<File> => {
        const blob = await generatePdfBlob();
        return new File([blob], 'cover-page.pdf', { type: 'application/pdf' });
    };

    // Component to show download link
    const DownloadLink: React.FC<{ fileName?: string }> = ({ fileName = 'cover-page.pdf' }) => (
        <PDFDownloadLink
            document={
                <CoverPageDocument
                    paperData={paperData}
                    seriesSettings={seriesSettings}
                    pageSize={pageSize}
                />
            }
            fileName={fileName}
            style={{
                textDecoration: 'none'
            }}
        >
            {({ loading }) => loading ? 'Generating PDF...' : 'Download Cover Page'}
        </PDFDownloadLink>
    );

    return {
        DownloadLink,
        generatePdfBlob,
        generatePdfFile
    };
};

export default CoverPageDocument;
