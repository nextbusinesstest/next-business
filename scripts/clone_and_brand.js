/**
 * Simple script to clone the /template folder and replace branding placeholders.
 * Usage: node scripts/clone_and_brand.js "ClientName" "#FF0000"
 *
 * It will create a folder ./clients/ClientName-next and replace:
 * - occurrences of "Next Business" with the ClientName
 * - replace logo in public/
 * - optionally change primary color in globals.css (naive replace)
 *
 * This is a starting point — adapt as needed.
 */
const fs = require('fs');
const path = require('path');

const [,, clientName, primaryColor] = process.argv;
if (!clientName) {
  console.error('Usage: node scripts/clone_and_brand.js "ClientName" "#RRGGBB"');
  process.exit(1);
}

const templateDir = path.join(__dirname, '..', 'template');
const clientsDir = path.join(__dirname, '..', 'clients');
if (!fs.existsSync(clientsDir)) fs.mkdirSync(clientsDir);

const dest = path.join(clientsDir, clientName.replace(/\\s+/g,'-').toLowerCase() + '-next');
if (fs.existsSync(dest)) {
  console.error('Destination exists:', dest);
  process.exit(1);
}

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst);
    for (const f of fs.readdirSync(src)) {
      copyRecursive(path.join(src,f), path.join(dst,f));
    }
  } else {
    let content = fs.readFileSync(src);
    // if it's text, try replace
    try {
      let s = content.toString('utf8');
      s = s.replace(/Next Business/g, clientName);
      s = s.replace(/Next Business/g, clientName);
      if (primaryColor) {
        s = s.replace(/teal-400/g, primaryColor);
      }
      fs.writeFileSync(dst, s, 'utf8');
    } catch (e) {
      // binary
      fs.copyFileSync(src, dst);
    }
  }
}

copyRecursive(templateDir, dest);

// copy logo placeholder if user wants to replace later
console.log('Created client folder at', dest);
console.log('Replace public/logo.png with the client logo and push to a new repo.');

/* Example:
   node scripts/clone_and_brand.js "Taller Martinez" "#FF6B6B"
*/
