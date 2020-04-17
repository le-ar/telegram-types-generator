#!/usr/bin/env node

import TelegramApi from "./lib/api/telegram_api";
import ParserTypesBlocks from "./lib/parsers/parser_types_blocks";
import ParserTypesBlock from "./lib/parsers/parser_types_block";
import ParserParameters from "./lib/parsers/parser_parameters";
import ParserParameter from "./lib/parsers/parser_parameter";
import BuilderFile from "./lib/builders/builder_file";
import BuilderSerializeFile from "./lib/builders/builder_serialize_file";
import ParserMethodsParameter from "./lib/parsers/parser_methods_parameter";
import ParserMethodsParameters from "./lib/parsers/parser_methods_parameters";
import ParserMethodsBlock from "./lib/parsers/parser_methods_block";
import ParserMethodsBlocks from "./lib/parsers/parser_methods_blocks";

let withMethodParams = process.argv.slice(2).indexOf('--mp') !== -1;
let withSerializeToFormData = process.argv.slice(2).indexOf('--fd') !== -1;

(async () => {
    let telegramApi = new TelegramApi();
    let parserParameter = new ParserParameter();
    let parserParameters = new ParserParameters(parserParameter);
    let parserTypesBlock = new ParserTypesBlock(parserParameters);
    let parserTypesBlocks = new ParserTypesBlocks(parserTypesBlock);

    let parserMethodsParameter = new ParserMethodsParameter();
    let parserMethodsParameters = new ParserMethodsParameters(parserMethodsParameter);
    let parserMethodsBlock = new ParserMethodsBlock(parserMethodsParameters);
    let parserMethodsBlocks = new ParserMethodsBlocks(parserMethodsBlock);

    // Key is heir. Value is inheritance  
    let inheritances: { [key: string]: string } = {};

    let types = parserTypesBlocks.parseHtmlToObject((await telegramApi.getHtml()).trim(), inheritances);

    BuilderFile.saveInputFileClass();
    BuilderSerializeFile.saveSerializerFile(withSerializeToFormData);

    for (let type of types['types']) {
        BuilderSerializeFile.buildFile(type, inheritances);
        BuilderFile.buildFile(type, inheritances);
    }

    if (withMethodParams) {
        let methodsProps = parserMethodsBlocks.parseHtmlToObject((await telegramApi.getHtml()).trim());

        for (let methodParam of methodsProps['types']) {
            methodParam.name += 'Param';
            methodParam.name = methodParam.name[0].toUpperCase() + methodParam.name.slice(1);
            BuilderSerializeFile.buildFile(methodParam, {}, '../method_params/');
            BuilderFile.buildFile(methodParam, {}, '../entities/', '/method_params');
        }
    }
})()