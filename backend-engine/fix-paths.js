const fs = require('fs');
if (fs.existsSync('index.js')) {
    fs.renameSync('index.js', 'config.js');
    console.log('Renamed index.js to config.js');
}

const files = fs.readdirSync('.').filter(f => f.endsWith('.js') && f !== 'fix-paths.js');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    // Fix standard relative imports: require('../path/to/module') -> require('./module')
    content = content.replace(/require\(['\"](\.\.?\/[^'\"]+)['\"]\)/g, (match, p1) => {
        const parts = p1.split('/');
        let file = parts[parts.length - 1];
        if (file === '') file = parts[parts.length - 2]; 
        
        // Exclude generic 'index.js' hardcodes we just fixed if needed, wait, run-tests
        // has require('./index'). We'll handle it globally below.
        return `require('./${file}')`;
    });

    // Fix require('./index') explicitly which I mistakenly set
    content = content.replace(/require\(['\"]\.\/index['\"]\)/g, "require('./config')");

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated ' + f);
    }
});
