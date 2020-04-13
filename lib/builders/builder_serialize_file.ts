var fs = require('fs');

let Serializer = `type ConstructorParams = {
    [key: string]: {
        type: string,
        required: boolean,
    }
};

class Serializer<T> {
    private static Serializers: { [key: string]: Serializer<any> } = {};

    private className: string;
    private tConstructor: new (p?: any) => T;
    private constructorParams: ConstructorParams;
    private paramsCamelToSnakeCase: { [key: string]: string } = {};
    private paramsSnakeToCamelCase: { [key: string]: string } = {};

    constructor(c: new (p?: any) => T, className: string, params: ConstructorParams) {
        this.tConstructor = c;

        this.className = className;
        this.constructorParams = params;
        this.setJsonAndParamNamesRef(params);
        Serializer.Serializers[className] = this;
    }

    private setJsonAndParamNamesRef(params: ConstructorParams): void {
        for (let param in params) {
            let snakeCase =
                param.replace(
                    /\\.?([A-Z])/g,
                    (x, y) => "_" + y.toLowerCase())
                    .replace(/^_/, "");
            this.paramsSnakeToCamelCase[snakeCase] = param;

            this.paramsCamelToSnakeCase[param] = snakeCase;
        }
    }

    fromJson(json: any): T {
        if (!(this.checkJson(json))) {
            throw new Error('Wrong json for type "' + this.className + '". Json: ' + json + '\\n');
        }

        let params: { [key: string]: any } = {};
        for (let paramName in this.constructorParams) {
            let param = this.constructorParams[paramName];
            if (this.paramsCamelToSnakeCase[paramName] in json) {
                let newParam = json[this.paramsCamelToSnakeCase[paramName]];
                try {
                    newParam = this.deserialize(newParam, param.type);
                    if (newParam === null) {
                        continue;
                    }
                } catch (e) {
                    continue;
                }
                params[paramName] = newParam;
            }
        }

        return new this.tConstructor(params);
    }

    private deserialize(value: any, type: string): any {
        if (type in Serializer.Serializers) {
            return Serializer.Serializers[type].fromJson(value);
        }
        if (type[type.length - 2] === '[' && type[type.length - 1] === ']') {
            if (!Array.isArray(value)) {
                throw new Error('Wrong json for type array "' + this.className + '". Json: ' + JSON.stringify(value) + '\\n');
            }
            let result: any[] = [];
            for (let element of value) {
                try {
                    result.push(this.deserialize(element, type.slice(0, type.length - 2)));
                } catch (e) { }
            }
            return result;
        }
        return value;
    }

    private checkJson(json: any) {
        return (
            json !== null &&
            typeof json === 'object' &&
            Object.keys(this.constructorParams).every(p => !this.constructorParams[p].required || this.paramsCamelToSnakeCase[p] in json)
        );
    }

    toJsonString(model: T): string {
        return JSON.stringify(this.toJsonObject(model));
    }

    toJsonObject(model: T): { [key: string]: any } {
        let json: { [key: string]: any } = {};
        let jsonModel: { [key: string]: any } = model;

        for (let paramName in this.constructorParams) {
            let param = this.constructorParams[paramName];
            if (typeof jsonModel[paramName] !== 'undefined' && jsonModel[paramName] !== null) {
                let newParam = jsonModel[paramName];
                try {
                    newParam = this.serialize(newParam, param.type);
                    if (newParam === null) {
                        continue;
                    }
                } catch (e) {
                    continue;
                }
                json[this.paramsCamelToSnakeCase[paramName]] = newParam;
            }
        }

        return json;
    }

    private serialize(value: any, type: string): any {
        if (type in Serializer.Serializers) {
            return Serializer.Serializers[type].toJsonObject(value);
        }
        if (type[type.length - 2] === '[' && type[type.length - 1] === ']') {
            if (!Array.isArray(value)) {
                throw new Error('Wrong json for type array "' + this.className + '". Json: ' + JSON.stringify(value) + '\\n');
            }
            let result: any[] = [];
            for (let element of value) {
                try {
                    result.push(this.serialize(element, type.slice(0, type.length - 2)));
                } catch (e) { }
            }
            return result;
        }
        return value;
    }
}

export default Serializer;
export { Serializer, ConstructorParams };`

class BuilderSerializeFile {
    private constructor() { }

    static saveSerializerFile() {
        if (!fs.existsSync(process.cwd() + '/serialize')) {
            fs.mkdirSync(process.cwd() + '/serialize');
        }
        fs.writeFileSync(process.cwd() + '/serialize/serializer.ts', Serializer);
    }

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
        let params: {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        } = this.convertParamsAndAddImport(type.name, JSON.parse(JSON.stringify(type.parameters)), imports);

        let result = '';

        result = this.buildImports(type.name, imports);
        result += '\n';
        result += this.buildConstructorParams(params);
        result += '\n';
        result += this.buildSeriazable(type.name);
        result += '\n';
        result += this.buildExport(type.name);

        this.saveToFile(type.name, result);
    }

    private static saveToFile(className: string, fileText: string) {
        let dir = process.cwd() + '/serialize';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(dir + '/' + this.pascalCaseToSnakeCase(className) + '_serializer.ts', fileText);
    }

    private static convertParamsAndAddImport(
        currentTypeName: string,
        params: {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        },
        imports: { [key: string]: string }): {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        } {
        let newParams = {};
        for (let param in params) {
            if (!params[param].optional && (params[param].type === 'True' || params[param].type === 'False')) {
                continue;
            }
            newParams[param] = params[param];
            newParams[param].name = this.snakeCaseToCamelCase(newParams[param].name);
            newParams[param].type = this.parseParamTypeAndAddImort(currentTypeName, params[param].type.trim(), imports);
        }
        return newParams;
    }

    private static parseParamTypeAndAddImort(
        currentTypeName: string,
        type: string,
        imports: { [key: string]: string }
    ) {
        if (type === 'Integer' || type === 'Float' || type === 'Float number') {
            return 'number';
        }
        if (type === 'String') {
            return 'string';
        }
        if (type === 'Boolean' || type === 'True' || type === 'False') {
            return 'boolean';
        }

        if (type.startsWith('Array of')) {
            return this.parseParamTypeAndAddImort(currentTypeName, type.slice(8).trim(), imports) + '[]';
        }

        let endIndexOfType = type.indexOf('</a>');
        if (endIndexOfType === -1) {
            throw new Error('Wrong type: ' + type);
        }
        let paramType = type.slice(type.indexOf('>') + 1, endIndexOfType).trim();
        if (paramType !== currentTypeName) {
            imports['./' + this.pascalCaseToSnakeCase(paramType) + '_serializer'] = paramType + 'Serializer';
        }
        return paramType;
    }

    private static buildImports(currentClassName: string, imports: { [key: string]: string }): string {
        let result = `import { Serializer, ConstructorParams } from './serializer';\n`;
        result += `import ` + currentClassName + ` from '../entities/` + this.pascalCaseToSnakeCase(currentClassName) + `';\n`;

        let init = '';
        for (let importSerialize in imports) {
            result += `import ` + imports[importSerialize] + ` from '` + importSerialize + `';\n`;
            init += `let _` + imports[importSerialize] + ` = ` + imports[importSerialize] + ';\n';
        }

        result += '\n' + init;

        return result;
    }

    private static buildConstructorParams(
        parameters: {
            [key: string]: {
                name: string;
                type: string;
                description: string;
                optional: boolean;
            }
        }): string {
        let result = `let params: ConstructorParams = {\n`;

        let paramsCount = Object.keys(parameters).length;
        let currParam = 1;
        for (let paramName in parameters) {
            let param = parameters[paramName];

            result += `    ` + param.name + `: {\n`;
            result += `        required: ` + !param.optional + `,\n`;
            result += `        type: '` + param.type + `'\n`;
            if (currParam === paramsCount) {
                result += `    }\n`;
            } else {
                result += `    },\n`;
            }
            currParam++;
        }

        result += `}\n`;

        return result;
    }

    private static buildSeriazable(currentClassName: string): string {
        let result = `let ` + currentClassName + `Serializer = new Serializer<` + currentClassName + `>(` + currentClassName + `, '` + currentClassName + `', params);\n`;

        return result;
    }

    private static buildExport(currentClassName: string): string {
        let result = 'export default ' + currentClassName + 'Serializer;\n';
        result += 'export { ' + currentClassName + 'Serializer' + ', params as ' + currentClassName + 'SerializerParams' + ' };'

        return result;
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

export default BuilderSerializeFile;