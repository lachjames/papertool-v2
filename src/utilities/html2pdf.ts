// @ts-expect-error
import html2pdf from 'html2pdf.js';
import { PageSize } from '../types';

/**
 * Converts HTML content to a PDF with improved reliability
 * @param htmlContent The HTML content to convert
 * @param pageSize The page size in points (PDF units)
 * @returns A promise that resolves to a Uint8Array of the PDF data
 */
export async function convertHtmlToPdf(
    htmlContent: string,
    pageSize: PageSize
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        try {
            // Create container div that will be rendered to PDF
            const container = document.createElement('div');
            
            // Set proper dimensions matching PDF page size
            container.style.width = `${pageSize.width}pt`;
            container.style.minHeight = `${pageSize.height}pt`;
            
            // Position the container in the viewport but make it invisible
            // This is better than positioning off-screen
            container.style.position = 'fixed';
            container.style.left = '0';
            container.style.top = '0';
            container.style.visibility = 'hidden'; // Hidden but still rendered
            container.style.overflow = 'visible';
            container.style.backgroundColor = '#ffffff';
            container.style.zIndex = '-1000';
            
            // Set the HTML content
            container.innerHTML = htmlContent;
            
            // Add to body to allow rendering
            document.body.appendChild(container);
            
            // Longer delay to ensure all resources are loaded
            setTimeout(() => {
                try {
                    // Configure PDF options with better settings
                    const options = {
                        margin: 0,
                        filename: 'coverpage.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { 
                            scale: 2, // Higher scale for better quality
                            backgroundColor: '#ffffff',
                            logging: false,
                            height: Math.max(container.scrollHeight, pageSize.height),
                            width: pageSize.width,
                            windowWidth: pageSize.width,
                            windowHeight: Math.max(container.scrollHeight, pageSize.height),
                            useCORS: true // Allow loading cross-origin images
                        },
                        jsPDF: {
                            unit: 'pt',
                            format: [pageSize.width, pageSize.height],
                            orientation: pageSize.height > pageSize.width ? 'portrait' : 'landscape',
                            compress: true,
                            hotfixes: ['px_scaling']
                        }
                    };
                    
                    // Log dimensions for debugging
                    console.log('Converting HTML to PDF with dimensions:', {
                        containerWidth: container.offsetWidth,
                        containerHeight: container.offsetHeight,
                        containerScrollHeight: container.scrollHeight,
                        pageWidth: pageSize.width,
                        pageHeight: pageSize.height
                    });
                    
                    // Generate the PDF
                    html2pdf()
                        .from(container)
                        .set(options)
                        .outputPdf('blob')
                        .then((pdfBlob: Blob) => {
                            // Convert blob to Uint8Array
                            const reader = new FileReader();
                            reader.onload = () => {
                                if (reader.result) {
                                    const arrayBuffer = reader.result as ArrayBuffer;
                                    resolve(new Uint8Array(arrayBuffer));
                                } else {
                                    reject(new Error('Failed to read PDF blob'));
                                }
                            };
                            reader.onerror = () => {
                                reject(new Error('Error reading PDF blob'));
                            };
                            reader.readAsArrayBuffer(pdfBlob);
                            
                            // Clean up DOM element
                            document.body.removeChild(container);
                        })
                        .catch((error: any) => {
                            console.error('HTML to PDF conversion error:', error);
                            // Clean up even if there's an error
                            if (document.body.contains(container)) {
                                document.body.removeChild(container);
                            }
                            reject(error);
                        });
                } catch (innerError) {
                    console.error('Error in HTML to PDF setup:', innerError);
                    // Ensure cleanup
                    if (document.body.contains(container)) {
                        document.body.removeChild(container);
                    }
                    reject(innerError);
                }
            }, 800); // Increased timeout for better rendering
        } catch (error) {
            console.error('Error setting up HTML to PDF conversion:', error);
            reject(error);
        }
    });
}
