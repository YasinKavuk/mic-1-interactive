

export class MacroError extends Error {
    override name: string;
    override message: string;
    line: number;


    constructor({ name, message, line }: { name: string, message: string, line: number }) {
        super();
        this.name = name;
        this.message = message;
        this.line = line;
    }
}