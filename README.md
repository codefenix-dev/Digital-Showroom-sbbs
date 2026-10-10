# Digital Showroom (dsr)

This is a JavaScript mod for Synchronet BBS that lets your users view nearly any file on your
BBS, including images in sixel format in SyncTERM (or other capable terminals). Its ability to browse 
through archives containing various different file types makes it a great 
option for viewing art packs containing both ANSI and image files.

<img width="964" height="715" alt="Animation" src="https://github.com/user-attachments/assets/c7033c96-ced3-450f-b2e9-6b14e5ecea15" />

## Sixel Gallery has died. Long live Digital Showroom!

This is the successor to the old "Sixel Gallery" mod. The code has been 
completely refactored to make use of a much cleaner lightbar-driven menu,
and offer improved handling of file and archive types.


## Usage

Digital Showroom is completely lightbar driven. The user navigates the file 
list with the arrow keys, and presses Enter to make a selection.

Digital Showroom decides how to handle the selected file depending on its
type.

### Text and ANSI files: 
 
If [Scroller](https://github.com/codefenix-dev/Scroller-sbbs) is present on the system in /sbbs/xtrn/scroller, then it 
will be used to view the selected text or art file. Otherwise, the 
file is shown using Synchronet's standard console output, accounting
for iCE color modes if indicated in the ANSI SAUCE data.

### Image files:

All configured image file formats get converted to sixel via [ImageMagick](https://imagemagick.org/)
and displayed in the terminal. If multiple frames are generated, as with an animated 
GIF, the resulting frames are played as an animation, prompting the user
to choose how many times to loop through the frames and how fast to play 
the animation.

Converted sixel files are temporarily stored to /sbbs/xtrn/dsr/temp# 
where "#" is the user's node number. They stay in this path only until 
the sixel data is sent to the terminal, and then they are automatically 
cleaned up after being displayed.   
     
### Archive files:

All configured archive file formats are opened using the command line configured in
the settings.ini file.    

Extracted files are temporarily stored to /sbbs/xtrn/dsr/temp# where "#"
is the user's node number. They stay in this path for as long as the 
user is browsing them, and then they are automatically cleaned up when 
the user is done with them.


## Enjoy!

See readme.txt for full setup info and everything else.

