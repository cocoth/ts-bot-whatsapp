export class EmbedHandler{
    private embededCmd: Map<string, string> = new Map()
    
    public setEmbeddedCmd(phone: string, msg: string){
        this.embededCmd.set(phone, msg)
    }
    public getEmbeddedCmd(){
        return Array.from(this.embededCmd.entries())
        // return this.embededCmd.get(phone)
    }
    public deleteEmbeddedCmd(phone: string){
        if(phone){
            this.embededCmd.delete(phone)
        }else{
            this.embededCmd.clear()
        }
    }
    public listEmbeds(): string{
        if (this.embededCmd.size === 0) return "no embeded messages"
        
        let embeds = "*List:*\n"
        this.embededCmd.forEach((msg, phone)=>{
            embeds += `Phone: ${phone} \nMessage: ${msg}\n\n`
        })
        return embeds
    }
}