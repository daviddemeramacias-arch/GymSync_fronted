const StyleDictionary = require('style-dictionary').default;

const kebab = (value) =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();

// Names compatible with the variables already used in styles.scss
StyleDictionary.registerTransform({
  name: 'name/gymsync',
  type: 'name',
  matcher: () => true,
  transform: (token) => {
    const [group, ...rest] = token.path;
    const tail = kebab(rest.join('-'));
    switch (group) {
      case 'colors':
        return tail;
      case 'typography':
        return tail.startsWith('font-') ? tail : `font-${tail}`;
      case 'spacing':
        return `space-${tail}`;
      case 'radius':
        return `radius-${tail}`;
      default:
        return kebab(token.path.join('-'));
    }
  },
});

StyleDictionary.registerFormat({
  name: 'css/gymsync-vars',
  format: ({ dictionary }) => {
    const vars = dictionary.allTokens
      .map((token) => `  --${token.name}: ${token.value};`)
      .join('\n');
    return `/* Generated from DESIGN_TOKENS.json — do not edit by hand */\n:root {\n${vars}\n}\n`;
  },
});

module.exports = {
  source: ['tokens/tokens.json'],
  platforms: {
    css: {
      transforms: ['attribute/cti', 'name/gymsync'],
      buildPath: 'src/styles/tokens/',
      files: [{ destination: 'gymsync-tokens.css', format: 'css/gymsync-vars' }],
    },
  },
};
