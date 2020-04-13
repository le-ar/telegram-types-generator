Typescript classes code generator for [Telegram types](https://core.telegram.org/bots/api)

### Default output dirs:
```./etities/``` for Classes

```./serialize/``` for Serialize

## Install

```
    npm install -g telegram-types-generator
```

or

```
    yarn global add telegram-types-generator
```

## Usage

Run ```telegram-types-generator``` in directory where you want to generate classes

## Example Serializer

```typescript
import ChatSerializer from "./serialize/chat_serializer";
import Chat from "./entities/chat";

let chat = ChatSerializer.fromJson({
    id: 123,
    type: 'private',
    username: 'username',
    first_name: 'Name',
});

console.log(chat); /* Will print
Chat {
  _id: 123,
  _type: 'private',
  _title: null,
  _username: 'username',
  _firstName: null,
  _lastName: null,
  _photo: null,
  _description: null,
  _inviteLink: null,
  _pinnedMessage: null,
  _permissions: null,
  _slowModeDelay: null,
  _stickerSetName: null,
  _canSetStickerSet: null
*/}

console.log(chat instanceof Chat); // Will print true

let jsonChat = ChatSerializer.toJsonString(chat);
console.log(jsonChat); // Will print {"id":123,"type":"private","username":"username"}
```
