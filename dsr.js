/*

Digital Showroom               ▄ ▄ ▄
for Synchronet                 █████
Version 0.261009               ▐▄█▄▌ cf
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
by Craig Hendricks
codefenix@conchaos.synchro.net

ConstructiveChaos BBS:
  https://conchaos.synchro.net
 telnet://conchaos.synchro.net
    ssh://conchaos.synchro.net

*/

load("sbbsdefs.js");
require("dd_lightbar_menu.js", "DDLightbarMenu");
var sauce = load({},"sauce_lib.js");

const EXEC_PATH = backslash(js.exec_dir);
const SCROLLER_PATH = "../xtrn/scroller/scroller.js";
const SCROLLER_CMD_FMT = '?%s "%s" "%s" %s';
const XBIMAGE_PATH = "../exec/xbimage.js";
const XBIMAGE_CMD_FMT = '?%s show "%s"'
const TEMP_PATH = EXEC_PATH + "temp" + bbs.node_num;
const WIDTH = console.screen_columns;
const HEIGHT = console.screen_rows;
const HDR_FILE = "dsr" + (WIDTH >= 132 ? "_wide": "") + ".msg";
const WIDTH_MULTIPLIER = 8;
const HEIGHT_MULTIPLIER = 14;

var pathToMagick;
var resize;
var resizeMaxWidth = WIDTH * WIDTH_MULTIPLIER;
var resizeMaxHeight = HEIGHT * HEIGHT_MULTIPLIER;
var imgFormats;
var txtFormats;
var artFormats;
var extractCmds = {};
var filesWoExt;

function printImVersionInfo () {
    if (file_exists(pathToMagick)) {
        system.exec(pathToMagick + ' -version > "' + EXEC_PATH + 'info/About_ImageMagick.txt"');
    }
}

function showSixels(sixelPath) {
    var image = new File(sixelPath);
    if (image.exists) {
        if (image.open("rb", true)) {
            console.write(image.read());
            print(""); // prevents image destruction in IcyTerm, for some reason '\0/`
            image.close();
        }
    }
}

function handleImage(imgPath) {

    if (imgPath.match(/[\x00-\x1F\x7F"`&|;$<>^%]/)) {
        print("\x01r\x01hRejected filename: \x01w\x01h" + archiveFile + "\x01n");
        log(LOG_WARNING, "Rejected filename: " + imgPath);
        return;
    }

    if (file_isdir(imgPath)) {
        var sxl_frames = directory(backslash(imgPath) + "*.sixel");
        if (sxl_frames.length > 1) {
            console.clear(false);
            for (var s = 0; s < sxl_frames.length; s++) {
                console.home(false);
                showSixels(sxl_frames[s]);
            }
        } else if (sxl_frames.length === 1) {
            console.clear(false);
            console.home(false);
            showSixels(sxl_frames[0]);
        } 
    } else if (file_getext(imgPath).toLowerCase()==="sixel") {
        showSixels(imgPath);
    } else {
        console.clear(false);
        print("Preparing \x01b\x01h" + file_getname(imgPath) + "\x01w\x01h. Please wait.\x01n.\x01k\x01h..\x01n.\x01k\x01h.\x01w\x01h!");
        var tmpSixel = backslash(TEMP_PATH) + "temp" + bbs.node_num + "-%05d.sixel";
        var cmd = pathToMagick + " \"" + imgPath + "\" -coalesce " + (resize ? ("-resize " + resizeMaxWidth + "x" + resizeMaxHeight + " ") : "") + tmpSixel;
        var rslt = system.exec(cmd);
        var frames = directory(backslash(TEMP_PATH) + "temp" + bbs.node_num + "*.sixel");
        if (frames.length > 1) {
            print("\r\n\x01nThis image contains " + frames.length + " frames of \x01w\x01hANIMATION! \x01nLoop how many times? \x01k\x01h(max \x01n50\x01k\x01h)\x01n:");
            var loops = console.getnum(50);
            if (loops <= 0) {
                loops = 1;
            }
            print("\r\n\x01nAnimation delay \x01k\x01h(in milliseconds; default \x01w\x01h15\x01k\x01h):");
            var frame_delay = console.getnum(50);
            if (frame_delay <= 0) {
                frame_delay = 15;
            }
            console.clear(false);
            for (var l = 0; l < loops; l++) {
                if (!bbs.online || js.terminated) {
                    break;
                }
                for (var s = 0; s < frames.length; s++) {
                    console.home(false);
                    showSixels(frames[s]);
                    if (l >= loops-1) { // cleanup after the last loop.
                        file_remove(frames[s]);
                    }
                    mswait(frame_delay);
                }
            }
        } else if (frames.length === 1) {
            console.clear(false);
            console.home(false);
            showSixels(frames[0]);
            file_remove(frames[0]);
        } else {
            print("failed.");
            log(LOG_WARNING, "No output found for '" + imgPath + "'.");
        }
        if (rslt !== 0) {
            log(LOG_WARNING, "Convert for '" + imgPath + "' rslt: " + rslt);
        }
    }
}

function handleArchive(archiveFile, ext, destPath) {
    var extractCmd;
    var cmdRslt;
    var extracted = true;
    
    if (archiveFile.match(/[\x00-\x1F\x7F"`&|;$<>^%]/)) {
        print("\x01r\x01hRejected filename: \x01w\x01h" + archiveFile + "\x01n");
        log(LOG_WARNING, "Rejected filename: " + archiveFile);
        return;
    }

    mkdir(destPath);
    extractCmd = bbs.cmdstr(extractCmds[ext].replace("~path~", '"' + destPath + '"').replace("~file~", '"' + archiveFile + '"'));
    cmdRslt = system.exec( extractCmd );
    extracted = (cmdRslt === 0);

    // Use the built-in Archive class as a last resort 
    // in case the above extraction attempt fails.
    if (!extracted) {
        log(LOG_WARNING, "Extraction failed (result: " + cmdRslt + "): " + extractCmd);
        log(LOG_INFO, "Trying Archive class for: '" + archiveFile + "'.");
        var a = new Archive(archiveFile);
        try {
            a.extract(destPath);
        } catch (e) {
            log(LOG_ERROR, e);
        }
    }
}

function deleteTempDir(path) {
    // This makes a system call to handle the directory & file cleanup.. lifted from DD_Arc_Viewer
    path = path.replace(/\\$/, "").replace(/\/$/, ""); // trim off the right trailing \ or / if there is one...
	if (/^WIN/i.test(system.platform)) {
		system.exec("RD \"" + path + "\" /s /q");
	} else {
		system.exec("rm -rf \"" + path + "\"");
    }
}

function dirName(path) {
    var dnm = "";
    var levels = path.replace(/\\/g, "/").split(/\//);
    if (levels[levels.length-1]==="") {
        dnm = levels[levels.length-2];
    } else {
        dnm = levels[levels.length-1];
    }
    return dnm;
}

function getSelectionName(path, checkForIce) {
    if (checkForIce) {
        var sdat = new sauce.read(path);
        if (sdat.title) {
            return sdat.title + (sdat.author ? (" by " + sdat.author) : "");
        } else {
            return file_getname(path);
        }
    } else {
        return file_getname(path);
    }
}

function isArchive(file) {
    var res = false;
    var f = new File(file);
    if (f.open("rb")) {
        var headerBytes = f.read(7);
        res = (headerBytes.substr(0,4) === "\x50\x4B\x03\x04"         || // ZIP
               headerBytes.substr(0,6) === "\x52\x61\x72\x21\x1A\x07" || // RAR
               headerBytes.substr(0,2) === "\x60\xEA"                 || // ARJ               
               headerBytes.substr(2,3) === "\x2D\x6C\x68"                // LZH / LHA
        )
        f.close();
    }
    return res;
}

function browseFiles(path, parentPath) {
    var funcExit = false;
    var selectedFile = "";
    var lastSelected = "";
    var lastSelectedIndex;
    var dirItems = directory(backslash(path) + "*");
    var optIndex = 0;
    var ext;
    var fname;
    dirItems.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    while (bbs.online && !js.terminated && !funcExit) {
        console.clear();
        printf("\x01n\x010\x01L");
        console.printfile(EXEC_PATH + HDR_FILE, P_NOABORT);
        optIndex = 0;
        console.gotoxy(35, HEIGHT-1);
        console.center("\x01w\x01hQ\x01k\x01\h) \x01n Go back");
        var lbMenu = new DDLightbarMenu(17, 10, WIDTH-33, HEIGHT-11);
        for (var d = 0; d < dirItems.length; d++) {
            if (file_isdir(dirItems[d])) {
                fname = dirName(dirItems[d]);
                lbMenu.Add("[" + fname + "]", dirItems[d] );
                if (lastSelected===dirItems[d]) {
                    lastSelectedIndex = optIndex;
                }
                optIndex = optIndex + 1;
            }
        }
        for (var f = 0; f < dirItems.length; f++) {
            if (!file_isdir(dirItems[f])) {
                ext = (file_getext(dirItems[f])+"").toUpperCase();
                if ( imgFormats.indexOf(ext) >= 0 ||
                     txtFormats.indexOf(ext) >= 0 ||
                     artFormats.indexOf(ext) >= 0 ||
                     extractCmds[ext.toUpperCase()] ||
                     (ext === "UNDEFINED" && filesWoExt)) {
                    fname = getSelectionName(dirItems[f], artFormats.indexOf(ext) >= 0);
                    lbMenu.Add( fname, dirItems[f] );
                    if (lastSelected===dirItems[f]) {
                        lastSelectedIndex = optIndex;
                    }
                    optIndex = optIndex + 1;
                }
            }
        }
        console.gotoxy(1, 8);
        console.center("\x01nBrowsing \x01w\x01h" + (parentPath ? (parentPath + "/") : "").replace(/\//g, "\x01k/\x01w") + dirName(path) + "\x01n \x01k\x01h(\x01w\x01h" + optIndex + " \x01nfile"+(optIndex> 1?"s":"")+"\x01k\x01h)");
        if (optIndex == 0) {
            console.center("\x01mNo applicable files!");
            console.gotoxy((WIDTH/2)-8, HEIGHT/2);
            console.pause();
            return;
        }
        console.center("\x01nUse \x01w\x01h" + ascii(24) + " \x01nand \x01w\x01h" + ascii(25) +" \x01nkeys to scroll, \x01w\x01hENTER \x01nselects");
        lbMenu.colors.itemColor = "\x01k\x01h";
        lbMenu.colors.selectedItemColor = "\x01w\x01h\x01" + "4";
        lbMenu.AddAdditionalQuitKeys("qQ");
        lbMenu.borderEnabled = true;
        lbMenu.scrollbarEnabled = true;
        lbMenu.ampersandHotkeysInItems = false;
        if (lastSelected !== undefined && lastSelected !== "") {
            lbMenu.SetSelectedItemIdx(lastSelectedIndex);
        }
        selectedFile = lbMenu.GetVal();

        if (!selectedFile) {
            funcExit = true;
        } else {
            lastSelectedIndex = 0;
            lastSelected = selectedFile;
            ext = (file_getext(selectedFile) + "").toUpperCase();
            fname = file_getname(selectedFile);
            print("\x01n\x010\x01L");

            if (fname !== "" && (ext==="" || ext==="UNDEFINED")) {
                ext = isArchive(selectedFile) ? ".ZIP" : "";
            }

            if ( file_isdir(selectedFile) ) {
                var sxl_frames = directory(backslash(selectedFile) + "*.sixel");
                if (sxl_frames.length > 1) {
                    console.clear(false);
                    for (var s = 0; s < sxl_frames.length; s++) {
                        console.home(false);
                        showSixels(sxl_frames[s]);
                    }
                } else {
                    browseFiles(selectedFile, (parentPath ? (parentPath + "/") : "") + dirName(path));
                }
            } else if (extractCmds[ext]) {
                var destDir = backslash(TEMP_PATH) + fname;
                if (!file_isdir(destDir)) {
                    handleArchive(selectedFile, ext, destDir);
                }
                if (file_isdir(destDir)) {
                    browseFiles(destDir, (parentPath ? (parentPath + "/") : "") + dirName(path));
                    deleteTempDir(destDir);
                }
            } else if (txtFormats.indexOf(ext) >= 0 || artFormats.indexOf(ext) >= 0 || ext === "UNDEFINED" || ext === "") {
				if ((ext === ".XB" || ext === ".XBIN") && file_exists(XBIMAGE_PATH)) {
					bbs.exec( format(XBIMAGE_CMD_FMT, XBIMAGE_PATH, selectedFile) );											
				} else if (file_exists(SCROLLER_PATH)) {
                    bbs.exec( format(SCROLLER_CMD_FMT, SCROLLER_PATH, selectedFile, fname, "top" ), 0, EXEC_PATH );
                } else {
                    var sdat = new sauce.read(selectedFile);
                    console.clear(false);

                    if (artFormats.indexOf(ext) >= 0) {
                        if (sdat.ice_color || ext===".ICE" ) {
                            print("\x1b[?33;35h"); // switch iCE colors on
                        }
                        console.printfile(selectedFile, P_NOPAUSE | P_CPM_EOF | P_NOATCODES | P_OPENCLOSE);
                    } else {
                        console.printfile(selectedFile, P_CPM_EOF | P_NOATCODES | P_NOPAUSE | P_CPM_EOF | P_NOATCODES | P_OPENCLOSE);
                    }
                    console.pause();

                    printf("\x1b[1;"+console.screen_rows+"r"); // reset top and bottom margins, in case they were changed by a ESC[1;Xr sequence.
                    print("\x1b[*r"); // reset speed
                    print("\x1b[?33;35l"); // switch iCE colors off
                }
            } else if (imgFormats.indexOf(ext) >= 0) {
                handleImage(selectedFile);
                console.gotoxy(1, HEIGHT-1);
                console.pause();
            }
        }
    }

    printf("\x01n\x010\x01L");
    console.clear();
    console.home();
}

function mainMenu() {
    var funcExit = false;
    var selectedOption = "";
    var lastSelected;
    var jsonPaths = "";
    var fPaths = new File(EXEC_PATH + "paths.json");
    if (fPaths.open("r")) {
        jsonPaths = JSON.parse(fPaths.read());
        jsonPaths.push({"name":"- &INFO -", "path": EXEC_PATH + "info", "resize":false});
        fPaths.close();
        while (bbs.online && !js.terminated && !funcExit) {
            printf("\x01n\x010\x01L");
            console.home();
            console.printfile(EXEC_PATH + HDR_FILE, P_NOABORT);
            console.gotoxy(35, HEIGHT-1);
            console.center("\x01w\x01hQ\x01k\x01\h) \x01w\x01hQ\x01nuit");
            var lbMenu = new DDLightbarMenu(18, 9, WIDTH - 35, HEIGHT - 10);
            for (var s = 0; s < Object.keys(jsonPaths).length; s++) {
                lbMenu.Add( jsonPaths[s].name, s+1 );
            }
            console.gotoxy(20, 8);
            console.center("\x01nUse \x01w\x01h" + ascii(24) + " \x01nand \x01w\x01h" + ascii(25) +" \x01nkeys to scroll, \x01w\x01hENTER \x01nselects");
            lbMenu.colors.itemColor = "\x01k\x01h";
            lbMenu.colors.selectedItemColor = "\x01w\x01h\x01" + "4";
            lbMenu.AddAdditionalQuitKeys("qQ");
            lbMenu.borderEnabled = true;
            lbMenu.scrollbarEnabled = true;
            if (lastSelected !== undefined && lastSelected !== "") {
                lbMenu.SetSelectedItemIdx(lastSelected);
            }
            selectedOption = lbMenu.GetVal();

            if (!selectedOption) {
                funcExit = true;
            } else {
                selectedOption = parseInt(selectedOption) - 1;
                lastSelected = selectedOption;
                resize = jsonPaths[selectedOption].resize;
                browseFiles(jsonPaths[selectedOption].path);
            }
        }
    }
}

function init() {
    if (!file_isdir(TEMP_PATH)) {
        mkdir(TEMP_PATH);
    }
    var settings;
    var fIni = new File(EXEC_PATH + 'settings.ini');
    if (fIni.open('r')) {
        settings = { root: fIni.iniGetObject() };
        const sects = fIni.iniGetSections();
        pathToMagick = settings.root.pathToMagick;
        resize = settings.root.resize;
        filesWoExt = settings.root.filesWithoutExtensions;
        imgFormats = settings.root.imgFormats.split(';');
        txtFormats = settings.root.txtFormats.split(';');
        artFormats = settings.root.artFormats.split(';');
        for (var fsect in sects) {
            if (sects[fsect].substr(0, 8)==="archive_") {
                extractCmds["." + sects[fsect].substr(8).toUpperCase()] = fIni.iniGetValue(sects[fsect], "cmd") || settings.root.defaultArchiveExtractCmd;
            }
        }
        fIni.close();
        fIni = undefined;
    } else {
        print("\x01r\x01hError reading settings: \x01w\x01h" + EXEC_PATH + 'settings.ini' + "\x01n");
        log(LOG_ERROR, "Error reading settings: " + EXEC_PATH + 'settings.ini');
        exit();
    }

    printImVersionInfo();

    if (!file_exists(pathToMagick)) {
        print("\x01r\x01hImageMagick not found: \x01w\x01h" + pathToMagick + "\x01n");
        log(LOG_ERROR, "ImageMagick not found: " + pathToMagick);
        exit();
    }

    if (settings.root.unsupported_sixel_terminal_warning && console.cterm_version < 1189) {
        print("\x01k\x01hThis program makes use of \x01w\x01hSIXEL \x01k\x01hgraphics.\r\n");
        print("\x01k\x01hFor best results, come back using \x01w\x01hSyncTERM \x01k\x01hor \x01w\x01hMagiTerm\x01k\x01h.\r\n");
        print("You may see mixed (or no) results in the terminal you're currently using.\r\n");
        if (console.noyes("Run anyway")) {
            exit();
        }
    }    
}

init();
if (argv[0]) {
    handleImage(argv[0]);
} else {
    printf("\x1b[?25l"); // hide the blinking cursor 
    mainMenu();
    printf("\x1b[?25h"); // restores the blinking cursor    
}
