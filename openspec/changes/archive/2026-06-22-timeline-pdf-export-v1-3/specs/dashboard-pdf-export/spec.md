## ADDED Requirements

### Requirement: Dashboard page export to PDF
The system SHALL provide a PDF export feature for the Dashboard page (.dashboard-page). The exported PDF SHALL use A4 width (210mm), adaptive height proportional to content, and SHALL be rendered as a single continuous page without pagination. The PDF layout SHALL match the browser full-screen display.

#### Scenario: Successful PDF export
- **WHEN** user clicks "导出PDF" button on a fully loaded Dashboard page
- **THEN** the system captures .dashboard-page content, generates a PDF with A4 width and proportional height, and triggers a file download named "项目仪表盘-CPID710R8-{YYYYMMDD}.pdf"

#### Scenario: Export button hidden in PDF
- **WHEN** the PDF is generated
- **THEN** the "导出PDF" button itself SHALL NOT appear in the exported PDF

### Requirement: Export button disabled during loading or error
The system SHALL disable the "导出PDF" button when the Dashboard data is still loading (model === null) or when a loading error has occurred (error === true).

#### Scenario: Button disabled during loading
- **WHEN** Dashboard data is loading (model === null)
- **THEN** the "导出PDF" button SHALL be in disabled state

#### Scenario: Button disabled on error
- **WHEN** Dashboard data loading failed (error === true)
- **THEN** the "导出PDF" button SHALL be in disabled state

### Requirement: Export button placement
The system SHALL place the "导出PDF" button at the bottom-left corner within the ProjectTimeline section.

#### Scenario: Button visibility after data loaded
- **WHEN** Dashboard data has loaded successfully
- **THEN** the "导出PDF" button SHALL be visible and enabled at the bottom-left of the ProjectTimeline section
