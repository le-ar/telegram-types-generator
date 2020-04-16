import { ParserHtmlType } from "./parser_html";

class ParserMethodsParameter implements ParserHtmlType {
    parseHtmlToObject(html: string): { name: string, type: string, description: string; optional: boolean; } {
        let splited = [];
        for (let td of html.split('<td>')) {
            splited.push(td.trim());
        }
        return {
            name: splited[1].slice(0, splited[0].length - 5),
            type: splited[2].slice(0, splited[0].length - 5),
            description: splited[4].slice(0, splited[0].length - 5),
            optional: splited[3].indexOf('Optional') !== -1,
        };
    }

}

export default ParserMethodsParameter