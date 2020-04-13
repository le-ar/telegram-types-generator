import { ParserHtml } from "./parser_html";

class ParserTypesBlock implements ParserHtml {
    parserParameters: ParserHtml;

    constructor(parserParameters: ParserHtml) {
        this.parserParameters = parserParameters;
    }

    parseHtmlToObject(html: string, inheritances?: { [key: string]: string }): { [key: string]: any } {
        let result = {};

        result['name'] = this.parseName(html).name;
        if (result['name'][0].toUpperCase() !== result['name'][0] || result['name'].indexOf(' ') !== -1) {
            return result;
        }

        result['parameters'] = {};
        if (this.hasParameters(html)) {
            result['parameters'] = this.parseParameters(html);
        } else {
            for (let heir of this.parseHeirs(html)) {
                inheritances[heir] = result['name'];
            }
        }

        return result;
    }

    private hasParameters(html: string): any {
        return html.indexOf('<tbody>') !== -1;
    }

    private parseHeirs(html: string): any {
        let result = [];
        let startHeirsIndex = html.indexOf('<ul>');
        if (startHeirsIndex !== -1) {
            let heirsContainer = html.slice(startHeirsIndex + 4, html.indexOf('</ul>')).trim();
            let endHeirIndex = heirsContainer.indexOf('</a>');
            while (endHeirIndex < html.length && endHeirIndex !== -1) {
                let startHeirIndex = heirsContainer.slice(0, endHeirIndex).lastIndexOf('">') + 2;
                result.push(heirsContainer.slice(startHeirIndex, endHeirIndex).trim());
                endHeirIndex = heirsContainer.indexOf('</a>', endHeirIndex + 4);
            }
        }
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