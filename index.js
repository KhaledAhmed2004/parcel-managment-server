const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// jwt verify
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const usersCollection = client.db("parcel").collection("user");
    const bookingParcelCollection = client
      .db("parcel")
      .collection("bookingParcel");

    // jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("I need a new jwt", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Save or modify user data
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const isExist = await usersCollection.findOne(query);
      console.log("User found?----->", isExist);
      if (isExist) return res.send(isExist);
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user },
        },
        options
      );
      res.send(result);
    });

    app.get("/allUsers", async (req, res) => {
      const userType = req.query.userType;
      const query = userType ? { userType: userType } : {};

      try {
        const result = await usersCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error retrieving users:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // app.get("/allUsers", async (req, res) => {
    //   const result = await usersCollection.find().toArray();
    //   res.send(result);
    // });
    // app.get("/allParcels", async (req, res) => {
    //   const result = await bookingParcelCollection.find().toArray();
    //   res.send(result);
    // });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });
    // Logout
    app.get("/logout", async (req, res) => {
      try {
        res
          .clearCookie("token", {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
        console.log("Logout successful");
      } catch (err) {
        res.status(500).send(err);
      }
    });

    app.post("/bookParcel", async (req, res) => {
      const booking = req.body;
      const result = await bookingParcelCollection.insertOne(booking);
      res.send(result);
    });

    app.put("/bookParcel/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const updateData = {
          $set: {
            ...req.body,
          },
        };
        const option = { upsert: true };
        const result = await bookingParcelCollection.updateOne(
          id,
          updateData,
          option
        );
        res.send(result);
      } catch (error) {
        console.log("Error processing the JSON data:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.get("/bookParcel/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingParcelCollection.findOne(query);

        if (!result) {
          return res.status(404).send({ message: "Parcel not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error retrieving parcel:", error);
        res.status(500).send("Internal Server Error");
      }
    });
    app.delete("/bookParcel/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingParcelCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log("Error processing the JSON data:", error);
      }
    });
    app.get("/myParcels/:email", async (req, res) => {
      const email = req.params.email;
      const result = await bookingParcelCollection
        .find({ email: email })
        .toArray();
      res.send(result);
    });

    console.log("mongodb is running...");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(port, () => {
  console.log("server is running...");
});
