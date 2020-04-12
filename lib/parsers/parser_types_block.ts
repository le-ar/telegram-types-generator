import { ParserHtml } from "./parser_html";

class ParserTypesBlock implements ParserHtml {
    parserParameters: ParserHtml;

    constructor(parserParameters: ParserHtml) {
        this.parserParameters = parserParameters;
    }

    parseHtmlToObject(html: string): { [key: string]: any } {
        let result = {};

        result['name'] = this.parseName(html).name;

        result['parameters'] = this.parseParameters(html);

        return result;
    }

    private parseParameters(html: string): any {
        let result = {};
        let startParamsIndex = html.indexOf('<tbody>');
        if (startParamsIndex !== -1) {
            result = this.parserParameters.parseHtmlToObject(html.slice(startParamsIndex + 7, html.indexOf('</tbody>')).trim());
        }
        return result;
    }

    private parseName(html: string): { name: string } {
        //parse Name
        let endOfName = html.indexOf('</h4>');
        if (endOfName === -1) {
            throw new Error('Invalid html ' + html);
        }
        let name = html.slice(0, endOfName);

        let startOfName = name.lastIndexOf('>');
        if (startOfName === -1) {
            throw new Error('Invalid html ' + html);
        }
        name = name.slice(startOfName + 1);

        return { name };
    }

}

export default ParserTypesBlock