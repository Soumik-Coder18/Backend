import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new apiError(404, "User not found while generating tokens");
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})
        
        return { accessToken, refreshToken };
        
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message || "Something went wrong while generating refresh or access token"
        );
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    // get user details
    // validation - not empty
    // check if user already exist or not : userName & email
    // check for images
    // check for avtar
    // uplodad in cloudnary
    // create user object : create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    let { userName, email, fullName, password } = req.body;

    if (!userName || !email || !fullName || !password) {
        throw new apiError(400, "All fields are required");
    }

    userName = userName.trim().toLowerCase();
    email = email.trim().toLowerCase();

    if ([userName, email, fullName, password].some(field => field.trim() === "")) {
        throw new apiError(400, "Fields cannot be empty");
    }

    console.log("email :",email);
    console.log("userName:",userName);
    
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser){
        throw new apiError(409,"user with email or userName already exists");
    }
    console.log("FILES RECEIVED:", req.files);
    const avatarLocalPath = req?.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req?.files?.coverImage?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new apiError(400,"Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new apiError(400,"Avatar is required");
    }
    
    

    const newUser = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        userName
    })

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )
    if (!createdUser){
        throw new apiError(500,"Something went wrong during the registrations");
    }
    // Response
    return res.status(201).json(
        new apiResponse(200,createdUser,"User Registered Successfully")
    )
    
})

const loginUser = asyncHandler(async(req,res)=>{
    // Req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const {email, userName, password} = req.body;
    
    if (!userName && !email) {
        throw new apiError(400,"username and or email required")
    }

    const user = await User.findOne({
        $or : [{userName},{email}]
    })

    if (!user) {
        throw new apiError(404,"User doesn't exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new apiError(401,"Password is invalid")
    }

    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options ={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )

})

const logOutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options ={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new apiResponse(200,{},"User logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(401,"Unauthorized Response");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new apiError(401,"Invalid Refresh Token");
        }
        
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401,"Refresh Token is expired or used");
        }
    
        const options ={
            httpOnly: true,
            secure: true
        }
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new apiResponse(
                200,
                {accessToken,refreshToken: newRefreshToken},
                "Access token refresh successfully"
            )
        )
    } catch (error) {
        throw new apiError(401,error?.message||"Invalid refresh token")
    }
})

export {registerUser,loginUser,logOutUser,refreshAccessToken};