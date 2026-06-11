function Errorhandling(err, req , res , next) {
    console.error(err.stack);
    if (err.name === "ValidationError") {
        return res.status(400).json({ error: "user already found" , message:"user found" });
    }

    if (err.status) {
       
        return res.status(err.status).json({ error: err.message });
    }

  
    if (err.name === "MongoError" && err.code === 11000) {
        return res.status(400).json({ error: "Duplicate entry detected." });
    }

    if (err.name === "CastError") {
        return res.status(400).json({ error: "Invalid ID format" });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({ error: "Duplicate entry detected" ,message:"user already  found"});
    }
    res.status(500).json({ error: "Something went wrong. Please try again later." });
}


module.exports = Errorhandling;