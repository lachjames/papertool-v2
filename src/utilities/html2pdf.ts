// // @ts-expect-error
// import html2pdf from 'html2pdf.js';
// import { PageSize } from '../types';

// /**
//  * Converts an image URL to base64 to avoid CORS issues
//  */
// async function imageUrlToBase64(url: string): Promise<string> {
//     try {
//         const response = await fetch(url, { mode: 'cors' });
//         if (!response.ok) {
//             throw new Error(`Failed to fetch image: ${response.status}`);
//         }
//         const blob = await response.blob();
//         return new Promise((resolve, reject) => {
//             const reader = new FileReader();
//             reader.onload = () => resolve(reader.result as string);
//             reader.onerror = reject;
//             reader.readAsDataURL(blob);
//         });
//     } catch (error) {
//         console.warn('Failed to convert image to base64:', url, error);
//         // Return a transparent 1x1 pixel as fallback
//         return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
//     }
// }

// /**
//  * Processes HTML content to convert external images to base64 and improve PDF compatibility
//  */
// async function processImagesInHtml(htmlContent: string): Promise<string> {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(htmlContent, 'text/html');
//     const images = doc.querySelectorAll('img[src]');
    
//     const imagePromises = Array.from(images).map(async (img) => {
//         const src = img.getAttribute('src');
//         if (src && (src.startsWith('http') || src.startsWith('https'))) {
//             try {
//                 const base64 = await imageUrlToBase64(src);
//                 img.setAttribute('src', base64);
//             } catch (error) {
//                 console.warn('Failed to process image:', src, error);
//             }
//         }
//     });
    
//     await Promise.all(imagePromises);
//     return doc.documentElement.outerHTML;
// }

// /**
//  * Adds web fonts and improved CSS for better PDF rendering
//  */
// function addWebFontsAndImprovedCSS(htmlContent: string): string {
//     // Add web fonts and improved CSS for PDF rendering
//     const webFontsAndCSS = `
//     <link href="https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&family=Arial:wght@400;700&display=swap" rel="stylesheet">
//     <style>
//         /* Force font loading and improve PDF rendering */
//         @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&family=Arial:wght@400;700&display=swap');
        
//         /* PDF-specific improvements */
//         * {
//             -webkit-print-color-adjust: exact !important;
//             color-adjust: exact !important;
//             print-color-adjust: exact !important;
//         }
        
//         body, html {
//             font-family: 'Times New Roman', Times, serif !important;
//             -webkit-font-smoothing: antialiased !important;
//             -moz-osx-font-smoothing: grayscale !important;
//             text-rendering: optimizeLegibility !important;
//         }
        
//         /* Ensure images render properly */
//         img {
//             max-width: 100% !important;
//             height: auto !important;
//             display: block !important;
//             image-rendering: -webkit-optimize-contrast !important;
//             image-rendering: crisp-edges !important;
//         }
        
//         /* Improve text rendering */
//         p, div, span, h1, h2, h3, h4, h5, h6 {
//             font-family: 'Times New Roman', Times, serif !important;
//             -webkit-font-smoothing: antialiased !important;
//             -moz-osx-font-smoothing: grayscale !important;
//         }
        
//         /* Force background colors */
//         .cover-page {
//             background-color: #ffffff !important;
//             background: #ffffff !important;
//         }
        
//         /* Improve layout stability */
//         .cover-page * {
//             box-sizing: border-box !important;
//         }
//     </style>
//     `;
    
//     // Insert the fonts and CSS into the head
//     if (htmlContent.includes('<head>')) {
//         htmlContent = htmlContent.replace('<head>', `<head>${webFontsAndCSS}`);
//     } else {
//         htmlContent = `<html><head>${webFontsAndCSS}</head><body>${htmlContent}</body></html>`;
//     }
    
//     return htmlContent;
// }

// /**
//  * Converts HTML content to a PDF with improved reliability and styling
//  * @param htmlContent The HTML content to convert
//  * @param pageSize The page size in points (PDF units)
//  * @returns A promise that resolves to a Uint8Array of the PDF data
//  */
// export async function convertHtmlToPdf(
//     htmlContent: string,
//     pageSize: PageSize
// ): Promise<Uint8Array> {
//     return new Promise(async (resolve, reject) => {
//         let container: HTMLElement | null = null;
//         let wrapper: HTMLElement | null = null;
        
//         try {
//             console.log('Starting HTML to PDF conversion...');
            
//             // Add web fonts and improved CSS
//             console.log('Adding web fonts and improved CSS...');
//             let processedHtml = addWebFontsAndImprovedCSS(htmlContent);
            
//             // Process images to avoid CORS issues
//             console.log('Processing images in HTML...');
//             processedHtml = await processImagesInHtml(processedHtml);
//             console.log('Images processed successfully');
            
//             // Create a wrapper to isolate our content from page styles
//             wrapper = document.createElement('div');
//             wrapper.style.cssText = `
//                 position: fixed;
//                 top: -10000px;
//                 left: -10000px;
//                 width: ${pageSize.width}px;
//                 height: ${pageSize.height}px;
//                 background: #ffffff;
//                 z-index: -1;
//                 pointer-events: none;
//                 overflow: hidden;
//             `;
            
//             // Create container div that will be rendered to PDF
//             container = document.createElement('div');
            
//             // Style the container for proper rendering
//             container.style.cssText = `
//                 width: ${pageSize.width}px;
//                 height: ${pageSize.height}px;
//                 min-height: ${pageSize.height}px;
//                 max-width: ${pageSize.width}px;
//                 margin: 0;
//                 padding: 0;
//                 border: none;
//                 background: #ffffff;
//                 font-family: 'Times New Roman', Times, serif;
//                 font-size: 14px;
//                 line-height: 1.4;
//                 color: #000000;
//                 box-sizing: border-box;
//                 overflow: hidden;
//                 position: relative;
//                 transform: none;
//                 opacity: 1;
//                 -webkit-font-smoothing: antialiased;
//                 -moz-osx-font-smoothing: grayscale;
//                 text-rendering: optimizeLegibility;
//             `;
            
//             // Set the processed HTML content
//             container.innerHTML = processedHtml;
            
//             // Add container to wrapper, wrapper to body
//             wrapper.appendChild(container);
//             document.body.appendChild(wrapper);
            
//             console.log('Container added to DOM, waiting for fonts and content to load...');
            
//             // Wait for fonts to load
//             if (document.fonts) {
//                 await document.fonts.ready;
//                 console.log('Fonts loaded');
//             }
            
//             // Additional wait for layout
//             await new Promise(resolve => setTimeout(resolve, 1000));
            
//             // Ensure all images are loaded
//             const images = container.querySelectorAll('img');
//             console.log(`Found ${images.length} images to load`);
            
//             const imageLoadPromises = Array.from(images).map((img, index) => {
//                 return new Promise((resolve) => {
//                     if (img.complete && img.naturalWidth > 0) {
//                         console.log(`Image ${index + 1} already loaded`);
//                         resolve(true);
//                     } else {
//                         img.onload = () => {
//                             console.log(`Image ${index + 1} loaded successfully`);
//                             resolve(true);
//                         };
//                         img.onerror = () => {
//                             console.warn(`Image ${index + 1} failed to load`);
//                             resolve(true);
//                         };
//                         // Timeout after 5 seconds
//                         setTimeout(() => {
//                             console.warn(`Image ${index + 1} load timeout`);
//                             resolve(true);
//                         }, 5000);
//                     }
//                 });
//             });
            
//             await Promise.all(imageLoadPromises);
//             console.log('All images processed');
            
//             // Additional wait for any remaining layout calculations
//             await new Promise(resolve => setTimeout(resolve, 500));
            
//             // Configure PDF options with improved settings
//             const options = {
//                 margin: 0,
//                 filename: 'coverpage.pdf',
//                 image: { 
//                     type: 'jpeg', 
//                     quality: 1.0  // Maximum quality
//                 },
//                 html2canvas: { 
//                     scale: 3,  // Higher scale for better quality
//                     backgroundColor: '#ffffff',
//                     logging: false,
//                     height: pageSize.height,
//                     width: pageSize.width,
//                     windowWidth: pageSize.width,
//                     windowHeight: pageSize.height,
//                     useCORS: false,
//                     allowTaint: true,
//                     foreignObjectRendering: true,  // Better text rendering
//                     removeContainer: false,
//                     scrollX: 0,
//                     scrollY: 0,
//                     x: 0,
//                     y: 0,
//                     letterRendering: true,  // Better text rendering
//                     imageTimeout: 10000,  // Longer timeout for images
//                     onclone: (clonedDoc: Document) => {
//                         console.log('html2canvas cloned document');
                        
//                         // Ensure fonts are available in cloned document
//                         const clonedContainer = clonedDoc.querySelector('div[style*="width: ' + pageSize.width + 'px"]');
//                         if (clonedContainer) {
//                             console.log('Found cloned container with correct dimensions');
                            
//                             // Force font family on all elements in cloned document
//                             const allElements = clonedDoc.querySelectorAll('*');
//                             allElements.forEach(el => {
//                                 if (el instanceof HTMLElement) {
//                                     el.style.fontFamily = "'Times New Roman', Times, serif";
//                                 }
//                             });
//                         }
//                     }
//                 },
//                 jsPDF: {
//                     unit: 'px',
//                     format: [pageSize.width, pageSize.height],
//                     orientation: pageSize.height > pageSize.width ? 'portrait' : 'landscape',
//                     compress: false,  // Don't compress for better quality
//                     hotfixes: ['px_scaling'],
//                     precision: 16  // Higher precision
//                 }
//             };
            
//             console.log('Starting PDF conversion with improved settings:', {
//                 containerWidth: container.offsetWidth,
//                 containerHeight: container.offsetHeight,
//                 containerScrollHeight: container.scrollHeight,
//                 pageWidth: pageSize.width,
//                 pageHeight: pageSize.height,
//                 scale: options.html2canvas.scale,
//                 quality: options.image.quality
//             });
            
//             // Generate the PDF
//             html2pdf()
//                 .from(container)
//                 .set(options)
//                 .outputPdf('blob')
//                 .then((pdfBlob: Blob) => {
//                     console.log('PDF generated successfully, size:', pdfBlob.size, 'bytes');
                    
//                     // Convert blob to Uint8Array
//                     const reader = new FileReader();
//                     reader.onload = () => {
//                         if (reader.result) {
//                             const arrayBuffer = reader.result as ArrayBuffer;
//                             resolve(new Uint8Array(arrayBuffer));
//                         } else {
//                             reject(new Error('Failed to read PDF blob'));
//                         }
//                     };
//                     reader.onerror = () => {
//                         reject(new Error('Error reading PDF blob'));
//                     };
//                     reader.readAsArrayBuffer(pdfBlob);
//                 })
//                 .catch((error: any) => {
//                     console.error('HTML to PDF conversion error:', error);
//                     reject(error);
//                 })
//                 .finally(() => {
//                     // Clean up DOM elements
//                     console.log('Cleaning up DOM elements');
//                     if (wrapper && document.body.contains(wrapper)) {
//                         document.body.removeChild(wrapper);
//                     }
//                 });
                
//         } catch (error) {
//             console.error('Error in HTML to PDF conversion:', error);
//             // Ensure cleanup
//             if (wrapper && document.body.contains(wrapper)) {
//                 document.body.removeChild(wrapper);
//             }
//             reject(error);
//         }
//     });
// }
