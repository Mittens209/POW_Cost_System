# POW Cost Builder

A desktop application for managing and calculating POW (Program of Work) costs.

## Features

- Create and manage POW cost estimates
- Export data to Excel
- User-friendly interface
- Local file system integration
- Offline-first architecture

## Installation

### For Users

1. Go to the [Releases](https://github.com/Mittens209/POW_Cost_System/releases) page
2. Download the latest version:
   - For standard installation: Download `Pow Cost Builder-x.x.x-Setup.exe`
   - For portable use: Download `Pow Cost Builder-x.x.x-x64-portable.exe`
3. Run the downloaded file
4. Follow the installation prompts (if using the Setup version)

### System Requirements

- Windows 10 or later
- 4GB RAM minimum
- 500MB free disk space

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or Bun package manager
- Git

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Mittens209/POW_Cost_System.git
cd POW_Cost_System
```

2. Install dependencies:
```bash
# Using npm
npm install

# Or using Bun
bun install
```

3. Start the development server:
```bash
# Using npm
npm run dev

# Or using Bun
bun run dev
```

The development server will start at http://localhost:5173 with hot reload enabled.

### Building the Application

To create an executable:
```bash
# Using npm
npm run build

# Or using Bun
bun run build
```

The built application will be available in the `release` directory.

## Tech Stack

This project is built with modern web technologies:

- **Vite**: Fast bundler and dev server
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn-ui**: High-quality UI components
- **Electron**: Desktop application framework

## Project Structure

```
src/
├── components/     # React components
├── contexts/      # React contexts
├── hooks/         # Custom React hooks
├── lib/          # Utility functions
├── pages/        # Page components
├── types/        # TypeScript type definitions
└── utils/        # Helper functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Editing the Code

### 1. Local Development
- Clone the repository
- Install dependencies with `npm install`
- Start development server with `npm run dev`
- Make your changes with hot reload at http://localhost:5173

### 2. GitHub Web Editor
- Navigate to the file in GitHub
- Click the ✏️ (pencil) icon
- Make changes and commit directly in the browser

### 3. GitHub Codespaces
- Open repository in GitHub
- Click Code → Codespaces → New codespace
- Edit and run the project in the cloud

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/Mittens209/POW_Cost_System/issues) page
2. Create a new issue if your problem isn't already reported
