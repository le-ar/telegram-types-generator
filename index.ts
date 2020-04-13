#!/usr/bin/env node

import TelegramApi from "./lib/api/telegram_api";
import ParserTypesBlocks from "./lib/parsers/parser_types_blocks";
import ParserTypesBlock from "./lib/parsers/parser_types_block";
import ParserParameters from "./lib/parsers/parser_parameters";
import ParserParameter from "./lib/parsers/parser_parameter";
import BuilderFile from "./lib/builders/builder_file";
import BuilderSerializeFile from "./lib/builders/builder_serialize_file";

(async () => {
    let telegramApi = new TelegramApi();
    let parserParameter = new ParserParameter();
    let parserParameters = new ParserParameters(parserParameter);
    let parserTypesBlock = new ParserTypesBlock(parserParameters);
    let parserTypesBlocks = new ParserTypesBlocks(parserTypesBlock);

    // Key is heir. Value is inheritance  
    let inheritances: { [key: string]: string } = {};

    let types = parserTypesBlocks.parseHtmlToObject((await telegramApi.getHtml()).trim(), inheritances);

    BuilderSerializeFile.saveSerializerFile();
    for (let type of types['types']) {
        BuilderSerializeFile.buildFile(type, inheritances);
        BuilderFile.buildFile(type, inheritances);
    }
})()