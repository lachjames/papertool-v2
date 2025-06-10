// src/utilities/templates.ts

export const academicTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      background-color: #ffffff;
      color: #000000;
    }
    .cover-page {
      padding: 50pt;
      box-sizing: border-box;
      min-height: 100vh;
      position: relative;
      background-color: #ffffff;
    }
    .header-text {
      font-size: 14pt;
      font-style: italic;
      color: rgb(76, 76, 76);
      margin-bottom: 15pt;
    }
    .divider {
      height: 1px;
      background-color: rgb(178, 178, 178);
      margin-bottom: 35pt;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 30pt;
      color: #000000;
    }
    .authors {
      font-size: 12pt;
      margin-bottom: 20pt;
      color: #000000;
    }
    .institution {
      font-size: 12pt;
      margin-bottom: 20pt;
      display: {{ institutionDisplay }};
      color: #000000;
    }
    .affiliation {
      font-size: 12pt;
      margin-bottom: 20pt;
      display: {{ affiliationDisplay }};
      color: #000000;
    }
    .series-name {
      font-size: 12pt;
      margin-bottom: 20pt;
      display: {{ seriesNameDisplay }};
      color: #000000;
    }
    .date {
      font-size: 12pt;
      margin-bottom: 30pt;
      display: {{ dateDisplay }};
      color: #000000;
    }
    .abstract-section {
      display: {{ abstractDisplay }};
      margin-bottom: 25pt;
    }
    .abstract-header {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10pt;
      color: #000000;
    }
    .abstract {
      font-size: 11pt;
      text-align: justify;
      color: #000000;
    }
    .jel {
      font-size: 11pt;
      margin-bottom: 15pt;
      display: {{ jelDisplay }};
      color: #000000;
    }
    .keywords {
      font-size: 11pt;
      margin-bottom: 15pt;
      display: {{ keywordsDisplay }};
      color: #000000;
    }
    .page-number {
      font-size: 10pt;
      text-align: center;
      position: absolute;
      bottom: 30pt;
      left: 0;
      right: 0;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="header-text">{{ headerText }}</div>
    <div class="divider"></div>
    
    <div class="title">{{ title }}</div>
    
    <div class="authors">Authors: {{ authors }}</div>
    
    <div class="institution">Institution: {{ institution }}</div>
    
    <div class="series-name">Series: {{ seriesName }}</div>
    
    <div class="affiliation">Affiliation: {{ affiliation }}</div>
    
    <div class="date">Date: {{ date }}</div>
    
    <div class="abstract-section">
      <div class="abstract-header">Abstract:</div>
      <div class="abstract">{{ abstract }}</div>
    </div>
    
    <div class="jel">JEL Classification: {{ jel }}</div>
    
    <div class="keywords">Keywords: {{ keywords }}</div>
    
    <div class="page-number">Page 1</div>
  </div>
</body>
</html>
`;

export const minimalTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      background-color: #ffffff;
      color: #000000;
    }
    .cover-page {
      padding: 50pt;
      box-sizing: border-box;
      min-height: 100vh;
      position: relative;
      background-color: #ffffff;
    }
    .title {
      font-size: 26pt;
      font-weight: bold;
      margin-bottom: 50pt;
      color: #000000;
    }
    .authors {
      font-size: 14pt;
      font-style: italic;
      color: rgb(76, 76, 76);
      margin-bottom: 30pt;
    }
    .date {
      font-size: 12pt;
      color: rgb(128, 128, 128);
      margin-bottom: 30pt;
      display: {{ dateDisplay }};
    }
    .series-name {
      font-size: 12pt;
      font-style: italic;
      color: rgb(102, 102, 102);
      margin-bottom: 30pt;
      display: {{ seriesNameDisplay }};
    }
    .institution {
      font-size: 12pt;
      color: rgb(128, 128, 128);
      margin-bottom: 30pt;
      display: {{ institutionDisplay }};
    }
    .abstract {
      font-size: 11pt;
      text-align: justify;
      margin-top: 20pt;
      margin-bottom: 30pt;
      display: {{ abstractDisplay }};
      color: #000000;
    }
    .footer {
      height: 1px;
      background-color: rgb(178, 178, 178);
      position: absolute;
      bottom: 50pt;
      left: 50pt;
      right: 50pt;
    }
    .page-number {
      font-size: 10pt;
      text-align: center;
      color: rgb(128, 128, 128);
      position: absolute;
      bottom: 30pt;
      left: 0;
      right: 0;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="title">{{ title }}</div>
    
    <div class="authors">{{ authors }}</div>
    
    <div class="date">{{ date }}</div>
    
    <div class="series-name">{{ seriesName }}</div>
    
    <div class="institution">{{ institution }}</div>
    
    <div class="abstract">{{ abstract }}</div>
    
    <div class="footer"></div>
    <div class="page-number">Page 1</div>
  </div>
</body>
</html>
`;

export const formalTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      height: 100%;
      background-color: #ffffff;
      color: #000000;
    }
    .cover-page {
      min-height: 100vh;
      position: relative;
      background-color: #ffffff;
    }
    .header-box {
      background-color: rgb(230, 230, 242);
      border-bottom: 1px solid rgb(204, 204, 204);
      height: 120pt;
      width: 100%;
      padding: 40pt 60pt 0;
      box-sizing: border-box;
    }
    .header-text {
      font-size: 16pt;
      font-weight: bold;
      color: rgb(51, 51, 102);
      text-align: center;
      margin-bottom: 20pt;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
    }
    .series-name {
      font-size: 12pt;
      font-style: italic;
      color: rgb(76, 76, 76);
      display: {{ seriesNameDisplay }};
    }
    .date {
      font-size: 12pt;
      color: rgb(76, 76, 76);
      display: {{ dateDisplay }};
    }
    .main-content {
      padding: 60pt;
      box-sizing: border-box;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 20pt;
      color: #000000;
    }
    .divider {
      height: 1px;
      background-color: rgb(178, 178, 178);
      margin-bottom: 30pt;
    }
    .authors {
      font-size: 14pt;
      font-style: italic;
      margin-bottom: 30pt;
      color: #000000;
    }
    .institution {
      font-size: 14pt;
      color: rgb(76, 76, 76);
      margin-bottom: 50pt;
      display: {{ institutionDisplay }};
    }
    .abstract-section {
      display: {{ abstractDisplay }};
      margin-bottom: 30pt;
    }
    .abstract-header {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 15pt;
      color: #000000;
    }
    .abstract {
      font-size: 11pt;
      text-align: justify;
      color: #000000;
    }
    .jel {
      font-size: 11pt;
      margin-bottom: 15pt;
      display: {{ jelDisplay }};
      color: #000000;
    }
    .keywords {
      font-size: 11pt;
      margin-bottom: 15pt;
      display: {{ keywordsDisplay }};
      color: #000000;
    }
    .footer-box {
      background-color: rgb(230, 230, 242);
      border-top: 1px solid rgb(204, 204, 204);
      height: 60pt;
      width: 100%;
      position: absolute;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .page-number {
      font-size: 10pt;
      color: rgb(76, 76, 76);
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="header-box">
      <div class="header-text">{{ headerText }}</div>
      <div class="meta-row">
        <div class="series-name">{{ seriesName }}</div>
        <div class="date">{{ date }}</div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="title">{{ title }}</div>
      <div class="divider"></div>
      <div class="authors">By: {{ authors }}</div>
      
      <div class="institution">{{ institution }}</div>
      
      <div class="abstract-section">
        <div class="abstract-header">Abstract</div>
        <div class="abstract">{{ abstract }}</div>
      </div>
      
      <div class="jel">JEL Classification: {{ jel }}</div>
      
      <div class="keywords">Keywords: {{ keywords }}</div>
    </div>
    
    <div class="footer-box">
      <div class="page-number">Page 1</div>
    </div>
  </div>
</body>
</html>
`;

export const getTemplateByType = (templateType: string): string => {
    switch (templateType) {
        case 'academic':
            return academicTemplate;
        case 'minimal':
            return minimalTemplate;
        case 'formal':
            return formalTemplate;
        case 'custom':
            return defaultCustomTemplate;
        default:
            return academicTemplate;
    }
};

// A simplified default template for custom editing
export const defaultCustomTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      background-color: #ffffff;
      color: #000000;
    }
    .cover-page {
      padding: 50pt;
      box-sizing: border-box;
      min-height: 100vh;
      position: relative;
      background-color: #ffffff;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 30pt;
      color

: #000000;
    }
    .authors {
      font-size: 14pt;
      text-align: center;
      margin-bottom: 20pt;
      color: #000000;
    }
    .abstract-section {
      margin-top: 40pt;
      display: {{ abstractDisplay }};
    }
    .abstract-header {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10pt;
      color: #000000;
    }
    .abstract {
      font-size: 12pt;
      text-align: justify;
      color: #000000;
    }
    .footer {
      position: absolute;
      bottom: 30pt;
      left: 0;
      width: 100%;
      text-align: center;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="title">{{ title }}</div>
    <div class="authors">{{ authors }}</div>
    
    <div class="abstract-section">
      <div class="abstract-header">Abstract</div>
      <div class="abstract">{{ abstract }}</div>
    </div>
    
    <div class="footer">Page 1</div>
  </div>
</body>
</html>
`;
