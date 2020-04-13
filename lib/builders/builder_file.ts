var fs = require('fs');

class BuilderFile {
    static buildFile(
        type: {
            name: string,
            parameters: {
                [key: string]: {
                    name: string;
                    type: string;
                    description: string;
                    optional: boolean;
                }
            }
        }, inheritances: { [key: string]: string }
    ) {
        // Key is path. Value is Class Name
        let imports: { [key: string]: string } = {};
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
            params[param].type = this.parseParamTypeAndAddImort(type.name, type.parameters[param].type, imports);
        }

        let fileText = this.build(type.name, imports, params, inheritances);
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
        },
        inheritances: { [key: string]: string }
    ): string {
        let result = '';

        result += this.buildImports(className, imports, inheritances);

        result += this.buildClass(className, params, inheritances);

        return result;
    }

    private static buildImports(
        className: string,
        imports: { [key: string]: string },
        inheritances: { [key: string]: string }
    ): string {
        let result = '';

        if (className in inheritances) {
            result += 'import ' + inheritances[className] + ' from \'./' + this.pascalCaseToSnakeCase(inheritances[className]) + '\';\n'
        }

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
        },
        inheritances: { [key: string]: string }
    ): string {
        let extendsString = '';
        if (className in inheritances) {
            extendsString = ' extends ' + inheritances[className];
        }
        let result = 'class ' + className + extendsString + ' {\n';

        let hasParams = false;
        for (let paramName in params) {
            hasParams = true;

            let param = params[paramName];

            let operator = ':';

            let type = param.type;
            if (type === 'True' || type === 'False') {
                type = type.toLowerCase();
            }
            if (param.optional) {
                type += ' | null';
            }

            result += '    private _' + param.name + operator + ' ' + type + ';\n';
        }

        if (hasParams) {
            result += '\n    constructor(params: {\n'
            let space = '        ';

            for (let paramName in params) {
                let param = params[paramName];

                let type = param.type;
                if (type === 'True' || type === 'False') {
                    type = type.toLowerCase();
                }

                if (param.type !== 'True' && param.type !== 'False' || param.optional) {
                    result += space + param.name + (param.optional ? '?' : '') + ':' + ' ' + type + (param.optional ? ' | null' : '') + ';\n';
                }
            }
            result += '    }) {\n'

            if (className in inheritances) {
                result += '        super();\n';
            }

            for (let paramName in params) {
                let param = params[paramName];

                let value = 'params.' + param.name;

                if (param.type === 'True' || param.type === 'False') {
                    value = param.type.toLowerCase();
                }

                let setValueString = space + 'this._' + param.name + ' = ' + value + ';\n';
                if (param.optional) {
                    setValueString = space + 'if (typeof params.' + param.name + ' === \'undefined\' || params.' + param.name + ' === null) {\n' +
                        space + '    this._' + param.name + ' = null;\n' +
                        space + '} else {\n' +
                        '    ' + setValueString +
                        space + '}\n';
                }

                result += setValueString;
            }

            result += '    }\n\n';
            result += this.buildGetters(params);
        }

        result += '}\n\n';
        result += 'export default ' + className + ';';
        return result;
    }

    private static buildGetters(
        params: {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        }): string {
        let result = '';

        for (let paramName in params) {
            let param = params[paramName];
            let type = param.type;
            if (type === 'True' || type === 'False') {
                type = type.toLowerCase();
            }

            let returnString = '        return this._' + param.name + ';\n';

            result += '    get ' + param.name + '(): ' + type + ' ' + (param.optional ? '| null ' : '') + '{\n';
            result += returnString;
            result += '    }\n';
        }

        return result;
    }

    private static parseParamTypeAndAddImort(
        name: string,
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
            return this.parseParamTypeAndAddImort(name, type.slice(8).trim(), imports) + '[]';
        }

        if (type.indexOf(' or ') !== -1) {
            let splitted = type.split(' or ');
            return splitted.map((el) => this.parseParamTypeAndAddImort(name, el.trim(), imports)).join(' | ');
        }

        let endIndexOfType = type.indexOf('</a>');
        if (endIndexOfType === -1) {
            throw new Error('Wrong type: ' + type);
        }
        let paramType = type.slice(type.indexOf('>') + 1, endIndexOfType).trim();
        if (paramType !== name) {
            if (paramType === 'InputFile') {
                return 'Buffer';
            }
            imports['./' + this.pascalCaseToSnakeCase(paramType)] = paramType;
        }
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