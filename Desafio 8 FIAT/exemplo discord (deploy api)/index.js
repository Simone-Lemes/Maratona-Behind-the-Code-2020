const express = require("express");
const multer = require("multer");
const fs = require("fs");
const NaturalLanguageUnderstandingV1 = require("ibm-watson/natural-language-understanding/v1");
const { IamAuthenticator } = require("ibm-watson/auth");

const app = express();

app.set("view engine", "ejs");

const location = process.env.LOCATION || "local";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "text/");
  },
  limits: {
    files: 1,
    fileSize: 1024 * 1024,
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var path = require("path");
    var ext = path.extname(file.originalname);
    console.error(ext);
    if (ext !== ".flac") {
      return callback(new Error("Only flac file is allowed"));
    }
    callback(null, true);
  },
});

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: "2020-09-15",
  authenticator: new IamAuthenticator({
    apikey: "KEY",
  }),
  serviceUrl: "URL",
  headers: {
    "X-Watson-Learning-Opt-Out": "false",
  },
  disableSslVerification: true,
});

app.get("/", (_, res) => {
  // return res.send("<h1>Hello  from " + location + "</h1>");
  res.render("home");
});

app.post("/recommend", upload.single("audio"), async (req, res) => {
  const audio = req.file;
  const car = req.body.car;
  let text = req.body.text;
  if (!car) {
    return res.json({
      err: "Parâmetro requerido não encontrado.",
    });
  } else if (!text && !audio) {
    return res.json({
      err: "Parâmetro requerido não encontrado.",
    });
  }

  const analyzeParams = {
    text: text,
    features: {
      entities: {
        sentiment: true,
        limit: 3,
      },
    },
  };

  naturalLanguageUnderstanding
    .analyze(analyzeParams)
    .then((analysisResults) => {
      const resultado = JSON.stringify(analysisResults.result, null, 2);
      console.log(resultado);
      res.send(resultado);
    })
    .catch((err) => {
      console.log("error:", err);
    });
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log("Executando na porta", port));
