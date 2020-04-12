var fs = require('fs');

class BuilderFile {
    static buildFile(type: {
        name: string,
        parameters: {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        }
    }) {
        // Key is path. Value is Class Name
        let imports: { [key: string]: string } = {};
        // Key is Param name. Value is type
        let params: {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        } = {};

        for (let param in type.parameters) {
            params[param] = type.parameters[param];
            params[param].name = this.snakeCaseToCamelCase(params[param].name);
            params[param].type = this.parseParamTypeAndAddImort(type.parameters[param].type, imports);
        }

        let fileText = this.build(type.name, imports, params);
        this.saveToFile(process.cwd() + '/entities/' + this.pascalCaseToSnakeCase(type.name) + '.ts', fileText);
    }

    private static saveToFile(fileName: string, fileText: string) {
        if (!fs.existsSync(process.cwd() + '/entities')) {
            fs.mkdirSync(process.cwd() + '/entities');
        }
        fs.writeFileSync(fileName, fileText);
    }

    private static build(
        className: string,
        imports: { [key: string]: string },
        params: {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        }
    ): string {
        let result = '';

        result += this.buildImports(imports);

        result += this.buildClass(className, params);

        return result;
    }

    private static buildImports(imports: { [key: string]: string }): string {
        let result = '';

        for (let importFile in imports) {
            result += 'import ' + imports[importFile] + ' from \'' + importFile + '\';\n';
        }

        return result + (result.length > 0 ? '\n' : '');
    }

    private static buildClass(
        className: string,
        params: {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        }
    ): string {
        let result = 'class ' + className + ' {\n';

        let hasParams = false;
        for (let paramName in params) {
            hasParams = true;
            let param = params[paramName];
            result += '    ' + param.name + (param.optional ? '?' : '') + ':' + ' ' + param.type + ';\n';
        }

        if (hasParams) {
            result += '\n    constructor(params: {\n'
            let space = '        ';

            for (let paramName in params) {
                let param = params[paramName];
                result += space + param.name + (param.optional ? '?' : '') + ':' + ' ' + param.type + ';\n';
            }
            result += '    }) {\n'

            for (let paramName in params) {
                let param = params[paramName];
                result += space + 'this.' + param.name + ' = params.' + param.name + ';\n';

                if (param.optional) {
                    result += space + 'if (typeof params.' + param.name + ' === \'undefined\') {\n'
                    result += space + '    this.' + param.name + ' = null;\n';
                    result += space + '}\n'
                }
            }

            result += '    }\n'
        }

        result += '}\n\n';
        result += 'export default ' + className + ';';
        return result;
    }

    private static parseParamTypeAndAddImort(
        type: string,
        imports: { [key: string]: string }
    ) {
        if (type === 'Integer' || type === 'Float' || type === 'Float number') {
            return 'number';
        }
        if (type === 'String') {
            return 'string';
        }
        if (type === 'Boolean') {
            return 'boolean';
        }
        if (type === 'True' || type === 'False') {
            return type;
        }

        if (type.startsWith('Array of')) {
            return this.parseParamTypeAndAddImort(type.slice(8).trim(), imports) + '[]';
        }

        let endIndexOfType = type.indexOf('</a>');
        if (endIndexOfType === -1) {
            throw new Error('Wrong type: ' + type);
        }
        let paramType = type.slice(type.indexOf('>') + 1, endIndexOfType).trim();
        imports['./' + this.pascalCaseToSnakeCase(paramType)] = paramType;
        return paramType;
    }

    static pascalCaseToSnakeCase(str: string): string {
        return str.replace(
            /\.?([A-Z])/g,
            (x, y) => "_" + y.toLowerCase())
            .replace(/^_/, "");
    }

    static snakeCaseToCamelCase(str: string): string {
        return str.replace(
            /([-_][a-z])/g,
            (group) => group.toUpperCase()
                .replace('-', '')
                .replace('_', '')
        );
    }
}

export default BuilderFile;