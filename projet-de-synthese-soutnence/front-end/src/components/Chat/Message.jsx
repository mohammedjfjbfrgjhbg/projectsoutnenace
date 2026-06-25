function Message({text,type}){

return(

<div className={`message ${type}`}>
{text}
</div>

)

}

export default Message