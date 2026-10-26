// import { PageSize, resolvePageSize } from '../shared-pdf-types';
// import { PageSize as ReactPdfPageSize } from '@react-pdf/types';

// /**
//  * Converts shared PageSize to React-PDF's PageSize type
//  * 
//  * @param pageSize The shared PageSize object
//  * @returns A valid React-PDF PageSize value
//  */
// export function toReactPdfPageSize(pageSize: PageSize): ReactPdfPageSize {
//     // Handle standard formats
//     if (typeof pageSize === 'string') {
//         switch (pageSize) {
//             case 'a4': return 'A4';
//             case 'letter': return 'LETTER';
//             case 'small': 
//                 // React-PDF doesn't have 'small', so use dimensions
//                 return [432, 288]; // 6in x 4in in points
//             default: return 'A4';
//         }
//     }

//     // Handle custom sizes - convert from inches to points
//     const resolved = resolvePageSize(pageSize);
//     if (!resolved) {
//         return 'A4'; // Fallback
//     }

//     const widthPoints = parseFloat(resolved.width) * 72;
//     const heightPoints = parseFloat(resolved.height) * 72;
    
//     return [widthPoints, heightPoints] as ReactPdfPageSize;
// }

// /**
//  * Determines if the page is in portrait orientation
//  */
// export function isPortrait(pageSize: PageSize): boolean {
//     const resolved = resolvePageSize(pageSize);
//     if (!resolved) return true;
    
//     const widthNum = parseFloat(resolved.width);
//     const heightNum = parseFloat(resolved.height);
//     return heightNum > widthNum;
// }

// /**
//  * Gets orientation string for React-PDF
//  */
// export function getOrientation(pageSize: PageSize): 'portrait' | 'landscape' {
//     return isPortrait(pageSize) ? 'portrait' : 'landscape';
// }

// /**
//  * Convert shared PageSize to points for legacy functions
//  */
// export function pageToPoints(pageSize: PageSize): { width: number; height: number } {
//     const resolved = resolvePageSize(pageSize);
//     if (!resolved) {
//         // Fallback to A4
//         return { width: 595, height: 842 };
//     }
    
//     // Convert from inches to points (72 points = 1 inch)
//     const widthPoints = parseFloat(resolved.width) * 72;
//     const heightPoints = parseFloat(resolved.height) * 72;
    
//     return { width: widthPoints, height: heightPoints };
// }
