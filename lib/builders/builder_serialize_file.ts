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
        if (type.indexOf(' | ') !== -1) {
            let params = type.split(' | ');
            for (let currType of params) {
                if (currType in Serializer.Serializers) {
                    return Serializer.Serializers[currType].fromJson(value);
                }
            }
        }

        return value;
    }

    private checkJson(json: any) {
        return (
            json !== null &&
            typeof json === 'object' &&
            Object.keys(this.constructorParams).every(p => !this.constructorParams[p].required || this.paramsCamelToSnakeCase[p] in json) &&
            Object.keys(json).every(p => this.paramsSnakeToCamelCase[p] in this.constructorParams)
        );
    }

    

    checkParamsAndReturnInSnakeCaseIfOk(params: any): {
        ok: boolean;
        params?: { [key: string]: any };
    } {
        let ok = (
            params !== null &&
            typeof params === 'object' &&
            Object.keys(this.constructorParams).every(p => !this.constructorParams[p].required || p in params) &&
            Object.keys(params).every(p => p in this.constructorParams)
        );
        if (!ok) {
            return { ok: false };
        }

        let snakeParams: { [key: string]: any } = {};
        for (let param in params) {
            snakeParams[this.paramsCamelToSnakeCase[param]] = params[param];
        }
        return {
            ok: true,
            params: snakeParams
        };
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
                if (newParam instanceof Buffer) {
                    throw new Error('You can\\'t serialize Buffer to json. Use "multipart/form-data" instead');
                }
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
        if (type.indexOf(' | ') !== -1) {
            let params = type.split(' | ');
            for (let currType of params) {
                if (currType in Serializer.Serializers) {
                    return Serializer.Serializers[currType].toJsonObject(value);
                }
            }
        }

        return JSON.stringify(value);
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
        },
        inheritances: { [key: string]: string }
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
        } = this.convertParamsAndAddImport(type.name, JSON.parse(JSON.stringify(type.parameters)), imports);

        let reverseInheritances: any = {};
        for (let heir in inheritances) {
            if (!(inheritances[heir] in reverseInheritances)) {
                reverseInheritances[inheritances[heir]] = [];
            }
            reverseInheritances[inheritances[heir]].push(heir);
        }
        if (!(type.name in reverseInheritances)) {
            reverseInheritances[type.name] = [];
        }

        let result = '';

        result = this.buildImports(type.name, imports, reverseInheritances[type.name]);
        result += '\n';
        result += this.buildConstructorParams(params, reverseInheritances[type.name]);
        result += '\n';
        result += this.buildSeriazable(type.name, reverseInheritances[type.name]);
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
        if (type === 'InputFile') {
            return 'Buffer';
        }
        if (type === 'Boolean' || type === 'True' || type === 'False') {
            return 'boolean';
        }

        if (type.startsWith('Array of')) {
            return this.parseParamTypeAndAddImort(currentTypeName, type.slice(8).trim(), imports) + '[]';
        }

        if (type.indexOf(' or ') !== -1) {
            let splitted = type.split(' or ');
            return splitted.map((el) => this.parseParamTypeAndAddImort(currentTypeName, el.trim(), imports)).join(' | ');
        }

        let endIndexOfType = type.indexOf('</a>');
        if (endIndexOfType === -1) {
            throw new Error('Wrong type: ' + type);
        }
        let paramType = type.slice(type.indexOf('>') + 1, endIndexOfType).trim();
        if (paramType !== currentTypeName) {
            if (paramType === 'InputFile') {
                return 'Buffer';
            }
            imports['./' + this.pascalCaseToSnakeCase(paramType) + '_serializer'] = paramType + 'Serializer';
        }
        return paramType;
    }

    private static buildImports(
        currentClassName: string,
        imports: { [key: string]: string },
        reverseInheritances: string[]
    ): string {
        let result = `import { Serializer, ConstructorParams } from './serializer';\n`;
        result += `import ` + currentClassName + ` from '../entities/` + this.pascalCaseToSnakeCase(currentClassName) + `';\n`;

        let init = '';
        for (let importSerialize in imports) {
            result += `import ` + imports[importSerialize] + ` from '` + importSerialize + `';\n`;
            init += `let _` + imports[importSerialize] + ` = ` + imports[importSerialize] + ';\n';
        }
        for (let importSerialize of reverseInheritances) {
            result += `import { ` + importSerialize + `Serializer, ` + importSerialize + `SerializerParams } from './` + this.pascalCaseToSnakeCase(importSerialize) + `_serializer';\n`;
            init += `let _` + importSerialize + `Serializer = ` + importSerialize + 'Serializer;\n';
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
        },
        heirs: string[],
    ): string {
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

        for (let heir of heirs) {
            result += 'for (let param in ' + heir + 'SerializerParams) {\n';
            result += '    params[param] = {\n';
            result += '        required: false,\n';
            result += '        type: ' + heir + 'SerializerParams[param].type\n';
            result += '    };\n';
            result += '}\n';
        }

        return result;
    }

    private static buildSeriazable(currentClassName: string, heirs: string[]): string {
        let result = '';
        let constructorName = currentClassName;

        if (heirs.length > 0) {
            result += this.buildFabric(heirs);
            result += '\n';
            constructorName = 'fabric';
        }

        result += `let ` + currentClassName + `Serializer = new Serializer<` + currentClassName + `>(` + constructorName + `, '` + currentClassName + `', params);\n`;

        return result;
    }

    private static buildFabric(heirs: string[]): string {
        let result = 'class fabric {\n';
        result += '    constructor(p?: any) {\n';

        if (heirs.length > 0) {
            result += '        let checkParams: { ok: boolean; params?: { [key: string]: any }; } = { ok: false };\n';
        }
        for (let heir of heirs) {
            result += '        checkParams = _' + heir + 'Serializer.checkParamsAndReturnInSnakeCaseIfOk(p);\n';
            result += '        if (checkParams.ok) {\n';
            result += '            return _' + heir + 'Serializer.fromJson(checkParams.params);\n';
            result += '        }\n';
        }
        if (heirs.length > 0) {
            result += '\n';
        }

        result += '        throw new Error(\'Wrong json for types [' + heirs.join(', ') + ']. Json: \' + JSON.stringify(p) + \'\\n\');\n';
        result += '    }\n}\n';

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