module.exports = {
  'env': {
    'es6': true,
    'node': true,
    'mocha': true,
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  'parser': '@typescript-eslint/parser',
  'plugins': [
    '@typescript-eslint',
    'mocha',
  ],
  extends: [
    // 'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
  ],
  'globals': {
  },
  'rules': {

    // Possible Errors

    'no-const-assign': 2,
    'no-var': 1, // disallow 'var'
    'no-cond-assign': 1, // disallow assignment operators in conditional expressions
    'no-console': 1, // disallow the use of console
    'no-constant-condition': 2, // disallow constant expressions in conditions
    'no-control-regex': 0, // disallow control characters in regular expressions
    'no-debugger': 2, // disallow the use of debugger
    'no-dupe-args': 2, // disallow duplicate arguments in function definitions
    'no-dupe-keys': 2, // disallow duplicate keys in object literals
    'no-duplicate-case': 2, // disallow duplicate case labels
    'no-empty': 0, // disallow empty block statements
    'no-empty-character-class': 2, // disallow empty character classes in regular expressions
    'no-ex-assign': 2, // disallow reassigning exceptions in catch clauses
    'no-extra-boolean-cast': 0, // disallow unnecessary boolean casts
    'no-extra-parens': 0, // disallow unnecessary parentheses
    'no-extra-semi': 1, // disallow unnecessary semicolons
    'no-func-assign': 2, // disallow reassigning function declarations
    'no-inner-declarations': 2, // disallow function or var declarations in nested blocks
    'no-invalid-regexp': 0, // disallow invalid regular expression strings in RegExp constructors
    'no-irregular-whitespace': 1, // disallow irregular whitespace outside of strings and comments
    'no-negated-in-lhs': 2, // disallow negating the left operand in `in` expressions
    'no-obj-calls': 2, // disallow calling global object properties as functions
    'no-prototype-builtins': 0, // Disallow use of Object.prototypes builtins directly
    'no-regex-spaces': 0, // disallow multiple spaces in regular expression literals
    'no-sparse-arrays': 1, // disallow sparse arrays
    'no-unexpected-multiline': 0, // disallow confusing multiline expressions
    'no-unreachable': 2, // disallow unreachable code after return, throw, continue, and break statements
    'no-unsafe-finally': 2, // disallow control flow statements in finally blocks
    'use-isnan': 2, // require calls to isNaN() when checking for NaN
    'valid-jsdoc': 0, // enforce valid JSDoc comments
    'valid-typeof': 2, // enforce comparing typeof expressions against valid strings

    // Best Practices

    'prefer-const': [1, { 'destructuring': 'all' }],
    'accessor-pairs': 0, // enforce getter and setter pairs in objects
    'complexity': 0, // enforce a maximum cyclomatic complexity allowed in a program
    'consistent-return': 0, // require return statements to either always or never specify values
    'curly': 1, // enforce consistent brace style for all control statements
    'default-case': 1, // require default cases in switch statements
    'dot-location': 0, // enforce consistent newlines before and after dots
    'dot-notation': 0, // enforce dot notation whenever possible
    'eqeqeq': 1, // require the use of === and !==
    'guard-for-in': 0, // require for-in loops to include an if statement
    'no-alert': 1, // disallow the use of alert, confirm, and prompt
    'no-caller': 1, // disallow the use of arguments.caller or arguments.callee
    'no-case-declarations': 0, // disallow lexical declarations in case clauses
    'no-div-regex': 2, // disallow division operators explicitly at the beginning of regular expressions
    'no-else-return': 0, // disallow else blocks after return statements in if statements
    'no-empty-function': 0, // disallow empty functions
    'no-empty-pattern': 0, // disallow empty destructuring patterns
    'no-eq-null': 1, // disallow null comparisons without type-checking operators
    'no-eval': 2, // disallow the use of eval()
    'no-extend-native': 1, // disallow extending native types
    'no-extra-bind': 1, // disallow unnecessary calls to .bind()
    'no-extra-label': 1, // disallow unnecessary labels
    'no-fallthrough': 1, // disallow fallthrough of case statements
    'no-floating-decimal': 1, // disallow leading or trailing decimal points in numeric literals
    'no-implicit-coercion': 0, // disallow shorthand type conversions
    'no-implicit-globals': 1, // disallow var and named function declarations in the global scope
    'no-implied-eval': 2, // disallow the use of eval()-like methods
    'no-invalid-this': 0, // disallow this keywords outside of classes or class-like objects
    'no-iterator': 1, // disallow the use of the __iterator__ property
    'no-labels': 0, // disallow labeled statements
    'no-lone-blocks': 1, // disallow unnecessary nested blocks
    'no-loop-func': 1, // disallow function declarations and expressions inside loop statements
    'no-magic-numbers': 0, // disallow magic numbers
    'no-multi-spaces': 1, // disallow multiple spaces
    'no-multi-str': 0, // disallow multiline strings
    'no-native-reassign': 1, // disallow assignments to native objects or read-only global variables
    'no-new': 1, // disallow new operators outside of assignments or comparisons
    'no-new-func': 1, // disallow new operators with the Function object
    'no-new-wrappers': 1, // disallow new operators with the String, Number, and Boolean objects
    'no-octal': 0, // disallow octal literals
    'no-octal-escape': 0, // disallow octal escape sequences in string literals
    'no-param-reassign': 0, // disallow reassigning function parameters
    'no-proto': 1, // disallow the use of the __proto__ property
    'no-redeclare': 1, // disallow var redeclaration
    'no-return-assign': 1, // disallow assignment operators in return statements
    'no-script-url: 1, // disallow javascript': 0, // urls
    'no-self-assign': 1, // disallow assignments where both sides are exactly the same
    'no-self-compare': 1, // disallow comparisons where both sides are exactly the same
    'no-sequences': 1, // disallow comma operators
    'no-throw-literal': 1, // disallow throwing literals as exceptions
    'no-unmodified-loop-condition': 1, // disallow unmodified loop conditions
    'no-unused-expressions': 1, // disallow unused expressions
    'no-unused-labels': 1, // disallow unused labels
    'no-useless-call': 1, // disallow unnecessary calls to .call() and .apply()
    'no-useless-concat': 1, // disallow unnecessary concatenation of literals or template literals
    'no-useless-escape': 1, // disallow unnecessary escape characters
    'no-void': 0, // disallow void operators
    'no-warning-comments': 0, // disallow specified warning terms in comments
    'no-with': 2, // disallow with statements
    'radix': 0, // enforce the consistent use of the radix argument when using parseInt()
    'vars-on-top': 0, // require var declarations be placed at the top of their containing scope
    'wrap-iife': 0, // require parentheses around immediate function invocations
    'yoda': 0, // require or disallow “Yoda” conditions

    // Strict Mode

    strict: 0, // require or disallow strict mode directives

    // Variables

    'init-declarations': 0, // require or disallow initialization in var declarations
    'no-catch-shadow': 1, // disallow catch clause parameters from shadowing variables in the outer scope
    'no-delete-var': 1, // disallow deleting variables
    'no-label-var': 1, // disallow labels that share a name with a variable
    'no-restricted-globals': 0, // disallow specified global variables
    'no-shadow': 1, // disallow var declarations from shadowing variables in the outer scope
    'no-shadow-restricted-names': 1, // disallow identifiers from shadowing restricted names
    'no-undef': 2, // disallow the use of undeclared variables unless mentioned in /*global */ comments
    'no-undef-init': 0, // disallow initializing variables to undefined
    'no-undefined': 0, // disallow the use of undefined as an identifier
    '@typescript-eslint/no-unused-vars': 1, // disallow unused variables
    'no-use-before-define': 0, // disallow the use of variables before they are defined

    // Node.js and CommonJS

    'callback-return': 1, // require require() calls to be placed at top-level module scope
    'handle-callback-err': 0, // require error handling in callbacks
    'no-mixed-requires': 0, // disallow require calls to be mixed with regular var declarations
    'no-new-require': 1, // disallow new operators with calls to require
    'no-path-concat': 0, // disallow string concatenation with __dirname and __filename
    'no-process-env': 0, // disallow the use of process.env
    'no-process-exit': 0, // disallow the use of process.exit()
    'no-restricted-modules': 0, // disallow specified modules when loaded by require
    'no-sync': 0, // disallow synchronous methods

    // Stylistic Issues

    'array-bracket-spacing': 0, // enforce consistent spacing inside array brackets
    'block-spacing': 0, // enforce consistent spacing inside single-line blocks
    'brace-style': [1, '1tbs', { 'allowSingleLine': true }], // enforce consistent brace style for blocks
    'camelcase': [1, { 'properties': 'never' }], // enforce camelcase naming convention
    'comma-dangle': [1, 'always-multiline'], // require or disallow trailing commas
    'comma-spacing': 1, // enforce consistent spacing before and after commas
    'comma-style': [1, 'last'], // enforce consistent comma style
    'computed-property-spacing': 1, // enforce consistent spacing inside computed property brackets
    'consistent-this': 1, // enforce consistent naming when capturing the current execution context
    'eol-last': 0, // enforce at least one newline at the end of files
    'func-names': 0, // require or disallow named function expressions
    'func-style': 0, // enforce the consistent use of either function declarations or expressions
    'id-blacklist': 0, // disallow specified identifiers
    'id-length': 0, // enforce minimum and maximum identifier lengths
    'id-match': 0, // require identifiers to match a specified regular expression
    'indent': ['warn', 2, { 'SwitchCase': 1 }], // enforce consistent indentation
    'jsx-quotes': 0, // enforce the consistent use of either double or single quotes in JSX attributes
    'key-spacing': 1, // enforce consistent spacing between keys and values in object literal properties
    'keyword-spacing': [1, { 'overrides': { 'catch': { 'after': false } } }], // enforce consistent spacing before and after keywords
    'linebreak-style': 1, // enforce consistent linebreak style
    'lines-around-comment': 0, // require empty lines around comments
    'max-depth': 0, // enforce a maximum depth that blocks can be nested
    'max-len': 0, // enforce a maximum line length
    'max-lines': 0, // enforce a maximum file length
    'max-nested-callbacks': [1, { 'max': 5 }], // enforce a maximum depth that callbacks can be nested
    'max-params': [1, { 'max': 5 }], // enforce a maximum number of parameters in function definitions
    'max-statements': 0, // enforce a maximum number of statements allowed in function blocks
    'max-statements-per-line': 0, // enforce a maximum number of statements allowed per line
    'multiline-ternary': 0, // enforce newlines between operands of ternary expressions
    'new-cap': [1, { 'capIsNew': false }], // require constructor function names to begin with a capital letter
    'new-parens': 1, // require parentheses when invoking a constructor with no arguments
    'newline-after-var': 0, // require or disallow an empty line after var declarations
    'newline-before-return': 0, // require an empty line before return statements
    'newline-per-chained-call': 0, // require a newline after each call in a method chain
    'no-array-constructor': 1, // disallow Array constructors
    'no-bitwise': 0, // disallow bitwise operators
    'no-continue': 0, // disallow continue statements
    'no-inline-comments': 0, // disallow inline comments after code
    'no-lonely-if': 0, // disallow if statements as the only statement in else blocks
    'no-mixed-operators': 0, // disallow mixes of different operators
    'no-mixed-spaces-and-tabs': 1, // disallow mixed spaces and tabs for indentation
    'no-multiple-empty-lines': 0, // disallow multiple empty lines
    'no-negated-condition': 0, // disallow negated conditions
    'no-nested-ternary': 1, // disallow nested ternary expressions
    'no-new-object': 1, // disallow Object constructors
    'no-plusplus': 0, // disallow the unary operators ++ and --
    'no-restricted-syntax': 0, // disallow specified syntax
    'no-spaced-func': 1, // disallow spacing between function identifiers and their applications
    'no-ternary': 0, // disallow ternary operators
    'no-trailing-spaces': 1, // disallow trailing whitespace at the end of lines
    'no-underscore-dangle': 0, // disallow dangling underscores in identifiers
    'no-unneeded-ternary': 0, // disallow ternary operators when simpler alternatives exist
    'no-whitespace-before-property': 0, // disallow whitespace before properties
    'object-curly-newline': 0, // enforce consistent line breaks inside braces
    'object-curly-spacing': 0, // enforce consistent spacing inside braces
    'object-property-newline': 0, // enforce placing object properties on separate lines
    'one-var': 0, // enforce variables to be declared either together or separately in functions
    'one-var-declaration-per-line': 0, // require or disallow newlines around var declarations
    'operator-assignment': 0, // require or disallow assignment operator shorthand where possible
    'operator-linebreak': 0, // enforce consistent linebreak style for operators
    'padded-blocks': 0, // require or disallow padding within blocks
    'quote-props': 0, // require quotes around object literal property names
    'quotes': [1, 'single'], // enforce the consistent use of either backticks, double, or single quotes
    'require-jsdoc': 0, // require JSDoc comments
    'semi': 1, // require or disallow semicolons instead of ASI
    'semi-spacing': 1, // enforce consistent spacing before and after semicolons
    'sort-vars': 0, // require variables within the same declaration block to be sorted
    'space-before-blocks': 1, // enforce consistent spacing before blocks
    'space-before-function-paren': [1, 'never'], // enforce consistent spacing before function definition opening parenthesis
    'space-in-parens': 0, // enforce consistent spacing inside parentheses
    'space-infix-ops': 0, // require spacing around operators
    'space-unary-ops': 0, // enforce consistent spacing before or after unary operators
    'spaced-comment': 0, // enforce consistent spacing after the // or /* in a comment
    'unicode-bom': 0, // require or disallow the Unicode BOM
    'wrap-regex': 0, // require parenthesis around regex literals
  },
};
