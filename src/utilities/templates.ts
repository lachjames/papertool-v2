// PDF-optimized templates with simplified CSS

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
      background: white;
      color: black;
    }
    .cover-page {
      padding: 50pt;
      background: white;
      color: black;
      position: relative;
    }
    .logo {
      text-align: center;
      margin-bottom: 20pt;
    }
    .logo img {
      max-height: 80pt;
      max-width: 200pt;
    }
    .header-text {
      font-size: 14pt;
      font-style: italic;
      color: #4c4c4c;
      margin-bottom: 15pt;
      text-align: center;
    }
    .divider {
      height: 1px;
      background-color: #b2b2b2;
      margin-bottom: 35pt;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 30pt;
      color: black;
      text-align: center;
    }
    .authors {
      font-size: 12pt;
      margin-bottom: 20pt;
      color: black;
      text-align: center;
    }
    .institution {
      font-size: 12pt;
      margin-bottom: 20pt;
      color: black;
      text-align: center;
    }
    .series-name {
      font-size: 12pt;
      margin-bottom: 20pt;
      color: black;
      text-align: center;
    }
    .date {
      font-size: 12pt;
      margin-bottom: 30pt;
      color: black;
      text-align: center;
    }
    .abstract-section {
      margin-bottom: 25pt;
    }
    .abstract-header {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10pt;
      color: black;
    }
    .abstract {
      font-size: 11pt;
      text-align: justify;
      color: black;
    }
    .jel {
      font-size: 11pt;
      margin-bottom: 15pt;
      color: black;
    }
    .keywords {
      font-size: 11pt;
      margin-bottom: 15pt;
      color: black;
    }
    .footer-image {
      text-align: center;
      margin-top: 40pt;
    }
    .footer-image img {
      max-height: 40pt;
      max-width: 100%;
    }
    .page-number {
      font-size: 10pt;
      text-align: center;
      margin-top: 20pt;
      color: black;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    {{#if logoUrl}}
    <div class="logo">
      <img src="{{logoUrl}}" alt="Logo" />
    </div>
    {{/if}}
    
    <div class="header-text">{{headerText}}</div>
    <div class="divider"></div>
    
    <div class="title">{{title}}</div>
    
    <div class="authors">{{authors}}</div>
    
    {{#if includeInstitution}}
    <div class="institution">{{institution}}</div>
    {{/if}}
    
    {{#if includeSeriesName}}
    <div class="series-name">{{seriesName}}</div>
    {{/if}}
    
    {{#if includeDate}}
    <div class="date">{{date}}</div>
    {{/if}}
    
    {{#if includeAbstract}}
    <div class="abstract-section">
      <div class="abstract-header">Abstract</div>
      <div class="abstract">{{abstract}}</div>
    </div>
    {{/if}}
    
    {{#if includeJEL}}
    {{#if jel}}
    <div class="jel">JEL Classification: {{jel}}</div>
    {{/if}}
    {{/if}}
    
    {{#if includeKeywords}}
    {{#if keywords}}
    <div class="keywords">Keywords: {{keywords}}</div>
    {{/if}}
    {{/if}}
    
    {{#if footerImageUrl}}
    <div class="footer-image">
      <img src="{{footerImageUrl}}" alt="Footer" />
    </div>
    {{/if}}
    
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
      background: white;
      color: black;
    }
    .cover-page {
      padding: 50pt;
      background: white;
      color: black;
      position: relative;
    }
    .logo {
      text-align: center;
      margin-bottom: 30pt;
    }
    .logo img {
      max-height: 60pt;
      max-width: 150pt;
    }
    .title {
      font-size: 26pt;
      font-weight: bold;
      margin-bottom: 50pt;
      color: black;
      text-align: center;
    }
    .authors {
      font-size: 14pt;
      font-style: italic;
      color: #4c4c4c;
      margin-bottom: 30pt;
      text-align: center;
    }
    .date {
      font-size: 12pt;
      color: #808080;
      margin-bottom: 30pt;
      text-align: center;
    }
    .series-name {
      font-size: 12pt;
      font-style: italic;
      color: #666666;
      margin-bottom: 30pt;
      text-align: center;
    }
    .institution {
      font-size: 12pt;
      color: #808080;
      margin-bottom: 30pt;
      text-align: center;
    }
    .abstract {
      font-size: 11pt;
      text-align: justify;
      margin-top: 20pt;
      margin-bottom: 30pt;
      color: black;
    }
    .footer {
      height: 1px;
      background-color: #b2b2b2;
      margin-top: 40pt;
      margin-bottom: 20pt;
    }
    .footer-image {
      text-align: center;
      margin-bottom: 20pt;
    }
    .footer-image img {
      max-height: 30pt;
      max-width: 100%;
    }
    .page-number {
      font-size: 10pt;
      text-align: center;
      color: #808080;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    {{#if logoUrl}}
    <div class="logo">
      <img src="{{logoUrl}}" alt="Logo" />
    </div>
    {{/if}}
    
    <div class="title">{{title}}</div>
    <div class="authors">{{authors}}</div>
    
    {{#if includeDate}}
    <div class="date">{{date}}</div>
    {{/if}}
    
    {{#if includeSeriesName}}
    <div class="series-name">{{seriesName}}</div>
    {{/if}}
    
    {{#if includeInstitution}}
    <div class="institution">{{institution}}</div>
    {{/if}}
    
    {{#if includeAbstract}}
    <div class="abstract">{{abstract}}</div>
    {{/if}}
    
    <div class="footer"></div>
    
    {{#if footerImageUrl}}
    <div class="footer-image">
      <img src="{{footerImageUrl}}" alt="Footer" />
    </div>
    {{/if}}
    
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
      background: white;
      color: black;
    }
    .cover-page {
      background: white;
      color: black;
      position: relative;
    }
    .header-box {
      background-color: #e6e6f2;
      border-bottom: 1px solid #cccccc;
      padding: 40pt 60pt;
      text-align: center;
    }
    .logo {
      margin-bottom: 15pt;
    }
    .logo img {
      max-height: 50pt;
      max-width: 120pt;
    }
    .header-text {
      font-size: 16pt;
      font-weight: bold;
      color: #333366;
      text-align: center;
      margin-bottom: 20pt;
    }
    .meta-row {
      text-align: center;
    }
    .series-name {
      font-size: 12pt;
      font-style: italic;
      color: #4c4c4c;
      display: inline-block;
      margin-right: 40pt;
    }
    .date {
      font-size: 12pt;
      color: #4c4c4c;
      display: inline-block;
    }
    .main-content {
      padding: 60pt;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 20pt;
      color: black;
      text-align: center;
    }
    .divider {
      height: 1px;
      background-color: #b2b2b2;
      margin-bottom: 30pt;
    }
    .authors {
      font-size: 14pt;
      font-style: italic;
      margin-bottom: 30pt;
      color: black;
      text-align: center;
    }
    .institution {
      font-size: 14pt;
      color: #4c4c4c;
      margin-bottom: 50pt;
      text-align: center;
    }
    .abstract-section {
      margin-bottom: 30pt;
    }
    .abstract-header {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 15pt;
      color: black;
    }
    .abstract {
      font-size: 11pt;
      text-align: justify;
      color: black;
    }
    .jel {
      font-size: 11pt;
      margin-bottom: 15pt;
      color: black;
    }
    .keywords {
      font-size: 11pt;
      margin-bottom: 15pt;
      color: black;
    }
    .footer-box {
      background-color: #e6e6f2;
      border-top: 1px solid #cccccc;
      padding: 20pt;
      text-align: center;
      margin-top: 40pt;
    }
    .footer-image {
      margin-bottom: 10pt;
    }
    .footer-image img {
      max-height: 30pt;
      max-width: 200pt;
    }
    .page-number {
      font-size: 10pt;
      color: #4c4c4c;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="header-box">
      {{#if logoUrl}}
      <div class="logo">
        <img src="{{logoUrl}}" alt="Logo" />
      </div>
      {{/if}}
      <div class="header-text">{{headerText}}</div>
      <div class="meta-row">
        {{#if includeSeriesName}}
        <span class="series-name">{{seriesName}}</span>
        {{/if}}
        {{#if includeDate}}
        <span class="date">{{date}}</span>
        {{/if}}
      </div>
    </div>
    
    <div class="main-content">
      <div class="title">{{title}}</div>
      <div class="divider"></div>
      <div class="authors">By: {{authors}}</div>
      
      {{#if includeInstitution}}
      <div class="institution">{{institution}}</div>
      {{/if}}
      
      {{#if includeAbstract}}
      <div class="abstract-section">
        <div class="abstract-header">Abstract</div>
        <div class="abstract">{{abstract}}</div>
      </div>
      {{/if}}
      
      {{#if includeJEL}}
      {{#if jel}}
      <div class="jel">JEL Classification: {{jel}}</div>
      {{/if}}
      {{/if}}
      
      {{#if includeKeywords}}
      {{#if keywords}}
      <div class="keywords">Keywords: {{keywords}}</div>
      {{/if}}
      {{/if}}
    </div>
    
    <div class="footer-box">
      {{#if footerImageUrl}}
      <div class="footer-image">
        <img src="{{footerImageUrl}}" alt="Footer" />
      </div>
      {{/if}}
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
      background: white;
      color: black;
    }
    .cover-page {
      padding: 50pt;
      background: white;
      color: black;
      position: relative;
    }
    .logo {
      text-align: center;
      margin-bottom: 20pt;
    }
    .logo img {
      max-height: 60pt;
      max-width: 150pt;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 30pt;
      color: black;
    }
    .authors {
      font-size: 14pt;
      text-align: center;
      margin-bottom: 20pt;
      color: black;
    }
    .abstract-section {
      margin-top: 40pt;
    }
    .abstract-header {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10pt;
      color: black;
    }
    .abstract {
      font-size: 12pt;
      text-align: justify;
      color: black;
    }
    .footer-image {
      text-align: center;
      margin-top: 40pt;
      margin-bottom: 20pt;
    }
    .footer-image img {
      max-height: 30pt;
      max-width: 100%;
    }
    .footer {
      text-align: center;
      color: black;
      margin-top: 20pt;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    {{#if logoUrl}}
    <div class="logo">
      <img src="{{logoUrl}}" alt="Logo" />
    </div>
    {{/if}}
    
    <div class="title">{{title}}</div>
    <div class="authors">{{authors}}</div>
    
    {{#if includeAbstract}}
    <div class="abstract-section">
      <div class="abstract-header">Abstract</div>
      <div class="abstract">{{abstract}}</div>
    </div>
    {{/if}}
    
    {{#if footerImageUrl}}
    <div class="footer-image">
      <img src="{{footerImageUrl}}" alt="Footer" />
    </div>
    {{/if}}
    
    <div class="footer">Page 1</div>
  </div>
</body>
</html>
`;
