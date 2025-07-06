const asyncHandler =(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(req,res,next).catch((error)=>next(error))
    }
}

export {asyncHandler}


// Try-Catch
// const asyncHandler =(func)=>async(req,res,next)=>{
//     try {
//         await func(req,res,next)
//     } catch (error) {
//         res.status(error.code || 404).json(
//             {
//                 success : false,
//                 message : error.message
//             }
//         )
//     }
// }
