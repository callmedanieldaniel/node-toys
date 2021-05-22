const fs = require("fs");
const path = require("path");
const parseJsonFile = require("./parseJsonFile");
const { Parser } = require("json2csv");

const DIR_ROOT = "/Users/wentao.kong/Desktop/statistic/";

async function getDirFileNames(directory) {
  return new Promise((res, rej) => {
    //   fs.readdirSync(directory).forEach((file) => {
    //   });
    fs.readdir(directory, (err, files) => {
      res(files);
    });
  });
}

async function getFilePaths(_dir) {
  //   fs.readdir(directory, (err, files) => {
  //     files.forEach((file) => {
  //       console.log(file);
  //     });
  //   });
  let fileNames = [];
  const loopDir = async (dir) => {
    let files = await getDirFileNames(dir);
    if (files && files.length) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fullPath = path.resolve(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
          await loopDir(fullPath);
        } else if (fullPath.endsWith(".json")) {
          fileNames.push(fullPath);
        }
      }
    }
  };
  await loopDir(_dir);

  Promise.all(
    fileNames.map((name) => {
      return new Promise((res, rej) => {
        parseJsonFile(name, (data) => {
          if (data) {
            res(data);
          } else {
            // 出错
            res(data);
          }
        });
      });
    })
  ).then((_results) => {
    let results = _results.filter((r) => !!r);
    console.log("done", results.length);
    const opt = {
      fields: [
        "projectUuid",
        "labeler",
        "car_rect5",
        "group",
        "labelVendor",
        "projectUuid",
        "qualityInspector",
        "file",
      ],
    };
    let list = [];
    results.forEach((proj) => {
      Object.keys(proj).forEach((k) => {
        let v = proj[k];
        list.push(v);
      });
    });
    const json2csvParser = new Parser(opt);
    const csv = json2csvParser.parse(list);
    fs.writeFile(DIR_ROOT + "data.csv", csv, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("File saved successfully!");
    });
    console.log(csv);
  });
}

getFilePaths(DIR_ROOT);
