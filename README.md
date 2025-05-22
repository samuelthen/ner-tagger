# NER Tagger

A web application for Named Entity Recognition (NER) tagging, built with Next.js, TypeScript, and Supabase.

## Features

- Team Management
- Project Creation and Management
- Dataset Management
- NER Labeling Interface
- User Authentication
- Real-time Collaboration

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd ner-tagger
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the frontend directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── store/           # State management
│   └── types/           # TypeScript types
├── public/              # Static assets
└── ...config files
```

## Usage Guide

1. **Team Setup**
   - First, create a team by navigating to the Team section
   - Add team members with their email addresses
   - Set appropriate roles and permissions

2. **Project Creation**
   - After team setup, create a new project
   - Assign team members to the project
   - Configure project settings and labeling guidelines

3. **Dataset Management**
   - Upload or create datasets within your project
   - Organize data into appropriate categories
   - Set up labeling schemas

4. **Labeling Process**
   - Access the labeling interface through your project
   - Use the provided tools to tag entities
   - Save and export labeled data

## Deployment

### Netlify Deployment

1. **Prepare for Deployment**
   - Ensure all environment variables are set in your local `.env.local`
   - Build the project locally to test:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Create a Netlify account if you haven't already
   - Connect your GitHub repository to Netlify
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
     - Node version: 18 (or higher)

3. **Environment Variables**
   - In Netlify dashboard, go to Site settings > Build & deploy > Environment
   - Add the following environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Deploy**
   - Netlify will automatically deploy your site
   - You can also trigger manual deploys from the Netlify dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 