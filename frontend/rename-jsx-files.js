const fs = require('fs');
const path = require('path');

// List of files to rename based on ESLint errors
const filesToRename = [
  'src/components/Common/LoadingSpinner.js',
  'src/components/Layout/Footer.js',
  'src/components/Layout/Header.js',
  'src/components/Layout/Layout.js',
  'src/components/admin/AdminLayout.js',
  'src/contexts/AuthContext.js',
  'src/index.js',
  'src/pages/AboutPage.js',
  'src/pages/ContactPage.js',
  'src/pages/DashboardPage.js',
  'src/pages/HomePage.js',
  'src/pages/NotFoundPage.js',
  'src/pages/ProfessionalDetailsPage.js',
  'src/pages/ProfessionalProfilePage.js',
  'src/pages/ProfessionalsPage.js',
  'src/pages/ProfilePage.js',
  'src/pages/admin/AdminClientsPage.js',
  'src/pages/admin/AdminContactsPage.js',
  'src/pages/admin/AdminDashboardPage.js',
  'src/pages/admin/AdminProductsPage.js',
  'src/pages/admin/AdminProfessionalsPage.js',
  'src/pages/auth/ForgotPasswordPage.js',
  'src/pages/auth/GoogleAuthCallbackPage.js',
  'src/pages/auth/LoginPage.js',
  'src/pages/auth/RegisterPage.js',
  'src/pages/auth/RegisterProfessionalPage.js',
  'src/pages/auth/ResetPasswordPage.js',
  'src/pages/auth/VerifyEmailPage.js',
  'src/pages/professional/ProfessionalDashboardPage.js',
  'src/pages/professional/ProfessionalProductsPage.js',
  'src/pages/professional/ProfessionalSessionsPage.js'
];

// Function to rename a file from .js to .jsx
function renameFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const newPath = absolutePath.replace('.js', '.jsx');
  try {
    if (fs.existsSync(absolutePath)) {
      fs.renameSync(absolutePath, newPath);
      console.log(`Renamed: ${filePath} → ${filePath.replace('.js', '.jsx')}`);
      return true;
    } else {
      console.log(`File not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error renaming ${filePath}:`, error);
    return false;
  }
}

// Process all files
let successCount = 0;
for (const file of filesToRename) {
  if (renameFile(file)) {
    successCount++;
  }
}

console.log(`\nRenamed ${successCount} of ${filesToRename.length} files.`);
