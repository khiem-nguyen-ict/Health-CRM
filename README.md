# Health CRM

A simple Customer Relationship Management (CRM) system designed for managing health events, patient data, and medical workflows.

## Overview

This Health CRM is a lightweight web application built with HTML, CSS, and JavaScript to help healthcare organizations manage:
- Patient registrations and health event tracking
- Medical appointment scheduling
- Health queue management
- Marketing campaign tracking
- Doctor and staff role-based access

## Features

- **Role-Based Access Control**: Different views for data entry, health staff, doctors, and marketing teams
- **Real-time Data Updates**: Automatic refresh of patient queues and appointment lists
- **Google Sheets Integration**: Backend data storage via Google Apps Script
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Capabilities**: Basic functionality available without constant connectivity
- **Customizable Workflows**: Adaptable to various health event types and medical processes

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Google Apps Script (acting as REST API interface to Google Sheets)
- **Deployment**: FTP-based deployment with versioning
- **Build Tools**: Custom minification scripts for production optimization

## File Structure

```
Health-CRM/
├── index.html              # Main dashboard
├── self-register.html      # Patient self-registration page
├── maintenance.html        # System maintenance page
├── qr/                     # QR code generation components
│   └── index.html
├── css/                    # Stylesheets
│   ├── style.css           # Main styles
│   ├── self-register.css   # Registration page styles
│   └── qr.css              # QR code component styles
├── js/                     # JavaScript modules
│   ├── app.js              # Core application logic and configuration
│   ├── role.js             # Role-based access control
│   ├── health.js           # Health queue management
│   ├── doctor.js           # Doctor queue management
│   ├── marketing.js        # Marketing campaign tracking
│   ├── media-report.js     # Media and reporting features
│   ├── media-pipe.js       # Media processing utilities
│   ├── participants.js     # Patient data management
│   └── self-register.js    # Self-registration logic
├── test/                   # Test scripts and sample data
│   ├── testParticipants.js
│   ├── test_data_5000.csv
│   └── generate.py
├ .dist/                    # Production build output (generated)
├ .env.production           # Environment variables (NOT in repository)
├ deploy.sh                 # Deployment script
├ minify.sh                 # Asset minification script
├ .htaccess                 # Apache server configuration
└ .gitignore                # Git ignore rules
```

## Setup and Installation

### Prerequisites
- Web server (Apache/Nginx) or ability to host static files
- Google Apps Script deployment for backend API
- FTP access for deployment (optional, for production)
- Node.js (for development tools, optional)

### Development Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Health-CRM
   ```

2. Install dependencies (if any):
   ```bash
   # No npm dependencies required for basic operation
   # For minification: npm install -g terser clean-css-cli html-minifier-terser
   ```

3. Configure environment:
   - Copy `.env.example` to `.env.production` and fill in your values:
     ```env
     APP_VERSION=1.0.0
     GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
     GOOGLE_SCRIPT_SS_ID=YOUR_GOOGLE_SHEET_ID
     FTP_USER=your_ftp_username
     FTP_PASS=your_ftp_password
     FTP_HOST=ftp://your_ftp_host
     REMOTE_DIR=/path/to/remote/directory
     ```

### Building for Production
1. Minify assets:
   ```bash
   ./minify.sh
   ```

2. Deploy via FTP:
   ```bash
   ./deploy.sh
   ```

## Usage

### Accessing the Application
- Main Dashboard: `index.html`
- Patient Self-Registration: `self-register.html`
- Maintenance Mode: `maintenance.html`

### User Roles
1. **Data Entry**: Register new patients, update basic information
2. **Health Staff**: Manage health queues, record vitals and preliminary assessments
3. **Doctor**: View patient queues, access full medical records, record diagnoses
4. **Marketing**: Track campaigns, manage outreach programs

### Data Flow
1. User interactions trigger JavaScript functions
2. Data is sent to/received from Google Apps Script endpoint
3. Google Apps Script reads/writes to Google Sheets
4. UI updates automatically based on data changes

## Configuration

### Google Apps Script Backend
The application expects a Google Apps Script Web App deployed with the following endpoints:
- `getAll`: Retrieve data from a specific sheet
- `save`: Save new records
- `update`: Modify existing records
- `init`: Initialize synchronization

See `js/app.js` for the exact API contract.

### Environment Variables
Configure via `.env.production`:
- `APP_VERSION`: Application version number
- `GOOGLE_SCRIPT_URL`: URL of your deployed Google Apps Script
- `GOOGLE_SCRIPT_SS_ID`: ID of the Google Sheet used for data storage
- `FTP_USER`: FTP username for deployment
- `FTP_PASS`: FTP password for deployment
- `FTP_HOST`: FTP host address
- `REMOTE_DIR`: Remote directory path for deployment

## Deployment

The project includes a deployment script (`deploy.sh`) that:
1. Loads environment variables from `.env.production`
2. Minifies CSS, JS, and HTML assets
3. Updates version numbers in HTML files
4. Deploys to remote server via FTP
5. Excludes development files and scripts

To deploy:
```bash
./deploy.sh
```

## Security Notes

⚠️ **Important Security Considerations**:
- Never commit `.env.production` to version control
- The Google Apps Script should be deployed with appropriate access restrictions
- Consider implementing additional authentication for sensitive operations
- Regularly rotate FTP credentials and Google API keys
- Review the Google Apps Script permissions to ensure principle of least privilege

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Your Name - [your-email@example.com](mailto:your-email@example.com)

Project Link: [https://github.com/your-username/Health-CRM](https://github.com/your-username/Health-CRM)

## Acknowledgments

- Google Apps Script for providing a simple backend solution
- Open source icons and images used in the interface
- Healthcare professionals who provided workflow insights