Digital Showroom (dsr.js)

by Craig Hendricks  
codefenix@conchaos.synchro.net  
 telnet://conchaos.synchro.net  
  https://conchaos.synchro.net  



Description:

 This is a JavaScript mod that lets your users view nearly any file on your
 BBS, including images in sixel format in SyncTERM. Its ability to browse 
 through archives containing various different file types makes it a great 
 option for viewing art packs containing both ANSI and image files.


Sixel Gallery has died. Long live Digital Showroom!

 This is the successor to the old "Sixel Gallery" mod. The code has been 
 completely refactored to make use of a much cleaner lightbar-driven menu,
 and offer improved handling of file and archive types.
 

Description:

 It can be ran one of two ways:
 
   1) As an External Program, which when ran gives the user a menu of available
      galleries configured, and lets the user browse lists of files to view.
   
   2) As a Viewable File Type, so that users browsing your file library 
      directories containing images (e.g.: GIFs Galore CD-ROM) can preview
      images prior to or instead of downloading them.
 
 In either mode, the script first checks to ensure the user is using SyncTERM 
 or equivalent sixel capable terminal (cterm_version >= 1189). If this check 
 fails, the user can optionally be shown a brief message warning them the 
 action they're performing may not work correctly (see Configuration and 
 Customization notes below).
 
 

Instructions:

 1. Extract the contents of the ZIP to /sbbs/xtrn/dsr
 
 2. Download and install ImageMagick from: https://imagemagick.org. Simply
    pick a version that's appropriate for your system. On my system at the time
    of this writing, I use ImageMagick 7.1.2-12 Q16-HDRI x64. 
 
 3. Open settings.ini in a text editor and edit the value of pathToMagick to
    the path where ImageMagick is located on your system, including the
    "magick" executable itself. 
    
    Example: 
    
      pathToMagick = c:\imagemagick\magick.exe
	  
	The rest of the options in settings.ini can be left as they are or changed
	to your liking. See Configuration and Customization for more info on all 
	the configurable options.
    
 4. Open paths.json in a text editor and add as many listings as you want. A
    few come preconfigured, and you'll want to either remove them or edit them 
    to point to correct paths on your system.
    
    name:   This is the text that shows in the directory list
    path:   This is the full path to the files
    resize: This specifies whether images should be resized to fit the terminal
            during conversion to sixel. It's often best to set this to true to 
            prevent sixel images from exceeding the terminal size. However, 
            setting it to false often works best for smaller animated GIF 
            files, to keep them from growing too large and taking a long time
            to convert and display.
          
    Examples:
    
    [
       {
          "name": "fsxNet - New images every day! (FSX_IMGE)",
          "path": "c:\\files\\fsxnet_files\\fsx_imge",
          "resize": true
       },
       {
          "name": "fsxNet - Art & ANSI Packs (FSX_ARTS)",
          "path": "c:\\files\\fsxnet_files\\fsx_arts",
          "resize": true
       },
       {
          "name": "Animations",
          "path": "c:\\files\\images\\animated_gifs",
          "resize": false
       }
    ]
    
    The file must be formatted as valid JSON, otherwise the script will fail
    with a description of the problem.
    
    
 5. Add to SCFG -> External Programs-> Online Programs (Doors):
 
    Name                  Digital Showroom
    Internal Code         DSR
    Start-up Directory    ../xtrn/dsr
    Command Line          ?dsr
    Access Requirements   ANSI
    

 6. Add to File Options -> Viewable Files: 

    GIF   ?../xtrn/dsr/dsr.js %f
    JPG   ?../xtrn/dsr/dsr.js %f
    PNG   ?../xtrn/dsr/dsr.js %f
    
    Continue to add as many other image file extension formats as you like.

    NOTE: If you have "?archive list %f" configured for * (libarchive), ensure 
          it's placed at the END of the Viewable Files list.
       
       

Configuration and Customization:

 Edit the dsr.msg and dsr_wide.msg files to your liking in PabloDraw.
 
 Edit the settings in the settings.ini file to your liking:
 
   pathToMagick = c:\imagemagick\magick.exe
   
     This is covered in the instructions above. It's worth noting that in
     previous versions of ImageMagick, image file conversion was handled by 
     a separate utility named "convert". In current versions of ImageMagick,
     the conversion functionality is merged into a single utility named
     "magick". So depending on the version of ImageMagick you're using, the
     name of the executable may be "convert" or "magick".

   
   unsupported_sixel_terminal_warning = true
   
     If you do NOT want to warn users about potential sixel incompatibility 
     issues with their terminal, set this to false. This will allow IcyTerm 
     users to be able to view sixel images without warning just fine, however, 
     users of other terminals (e.g. Netrunner) will see garbage dumped to the 
     screen without a warning, or a reason why. In most cases it's best to 
     leave this set to true.
     
   
   resize = true
   
     This ensures images are always resized to an appropriate size for the 
     terminal when converting images to sixel. It's normally best to keep 
     this set to true, to prevent sixel images from exceeding the terminal
     boundaries. 


   imgFormats = .JPG;.JPEG;.GIF;.PNG;.BMP;.PCX;.TIF;.TIFF;.WEBP
   txtFormats = .TXT;.ASC;.DOC;.NOW
   artFormats = .ANS;.MSG;.DIZ;.NFO;.ICE;.LIT;.TM
   
     These are the lists of file extensions Digital Showroom will include
     in its lists, separated by semicolons (;):
     
     imgFormats: Image files which get converted to sixel with ImageMagick.
     txtFormats: Text files which get output to the screen. *
     artFormats: Art file formats which get output to the screen. *
     
     * Currently both txtFormats and artFormats are handled the same way
       by the script. They are maintained separately to allow for possible
       future differences in handling.


 Archive types:

   [archive_zip]
   cmd = %@unzip -o -qq "~file~" -d "~path~"

   [archive_rar]
   cmd = 7z x -y "~file~" -o"~path~"

   [archive_7z]
   cmd = 7z x -y "~file~" -o"~path~"

   [archive_arj]
   cmd = 7z x -y "~file~" -o"~path~"


     Each configured type must start with [archive_type] where "type"
     is the file extension of the archive minus the dot.
       cmd: the command line to execute the extraction utility for the 
	        archive type, and it can take two specifiers:
            ~file~ ... the name of the archive.
            ~path~ ... the temporary extraction path.

     Although you can specify any archive utility you want for each archive 
     type, 7-Zip (7z) is probably the best tool to use for all of them.
     Grab the latest version from: https://7-zip.org/
     After you install it, you should be able to run it by simply 
     typing "7z" on the command line. Then this command line format
     should work for nearly all archive types: 7z x -y "~file~" -o"~path~"
     
     If a format is not specified, or if the archive extraction fails, an 
     attempt is made using Synchronet's built-in Archive library as a last
     resort. Ideally, this would be the only means of extracting files,
     however, at the time of this writing, this library is problematic and 
     often fails to successfully extract anything from even the most fairly 
     typical ZIP files. Therefore it's highly recommended to include as many
     archive and extraction types configurations as you expect to be needed.
     An example .RAR and .7z configuration is included in the settings.ini
     file to help.



Usage:

  As an External Program:

  Digital Showroom is completely lightbar driven. The user navigates the file 
  list with the arrow keys, and presses Enter to make a selection.
  
  Digital Showroom decides how to handle the selected file depending on its
  type, based on the file extension.
  
     Text and ANSI files: 
       
       If Scroller is present on the system in /sbbs/xtrn/scroller, then it 
       will be used to view the selected text or art file. Otherwise, the 
       file is shown using Synchronet's standard console output, accounting
       for iCE color modes if indicated in the ANSI SAUCE data.


     Image files:
     
       All image file formats specified in settings.ini get converted to sixel 
       and displayed. If multiple frames are generated, as with an animated 
       GIF, the resulting frames are played as an animation, prompting the user
       to choose how many times to loop through the frames and how fast to play 
       the animation.

       Converted sixel files are temporarily stored to /sbbs/xtrn/dsr/temp# 
	   where "#" is the user's node number. They stay in this path only until 
	   the sixel data is sent to the terminal, and then they are automatically 
	   cleaned up after being displayed.
	   
       
       
     Archive files:
     
       All archive file formats are opened using the command line configured in
       the settings.ini file. 
       
       Extracted files are temporarily stored to /sbbs/xtrn/dsr/temp# where "#"
       is the user's node number. They stay in this path for as long as the 
       user is browsing them, and then they are automatically cleaned up when 
       the user is done with them.



  Direct Image Conversion:       
 
  To utilize dsr.js for sixel image conversion from other scripts, simply 
  specify an image path as a parameter on the command line. The syntax 
  is as follows:
  
    ?../xtrn/dsr/dsr.js <path_to_image_file>
    


Thanks & Greetz:
    
  Huge thanks to Nightfox of Digital Distortion BBS for creating and 
  maintaining the awesome DDLightbarMenu library for Synchronet.
    - www.digitaldistortionbbs.com      



Other Notes:

  As explained near the top of this file, this mod began life as "Sixel 
  Gallery". Its initial goal was to simply display any image converted
  to sixel. Even though it did what it was supposed to do, I always felt
  this scope was too narrow, and the code was pretty sloppy.
  
  Since it's pretty common for art packs to be bundled up with GIF and JPG 
  art in addition to ANSI art, I figured it would make sense to shift Sixel
  Gallery's focus to be more of a generalized file browser. With the focus
  no longer squarely on sixels, a new name for the script was needed. "Digital
  Showroom" was the name I ended up going with.

 
 
Version History:  

v 0.261009 - Oct 9, 2026:

  + Shell out to xbimage.js for XB or XBIN files.
  + Improved and simplified archive extraction configuration.
  + Added support for files without extensions, with detection for
    handling.


v 0.250424 - April 24, 2025:

  + Initial version, based on a major refactoring of the old 
    sixelgallery.js code.
  