$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
$q='C:\Users\User\Documents\semi_projectlayout\.washwise-paper'
$source='C:\Users\User\Downloads\WashWise_Project_CCE106.docx'
$out='C:\Users\User\Downloads\WashWise_Chapters_1_to_3.docx'
$s=[IO.FileStream]::new($source,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::ReadWrite)
$z=[IO.Compression.ZipArchive]::new($s,[IO.Compression.ZipArchiveMode]::Read)
$r=[IO.StreamReader]::new($z.GetEntry('word/document.xml').Open())
[xml]$d=$r.ReadToEnd();$r.Dispose()
$n=[Xml.XmlNamespaceManager]::new($d.NameTable);$n.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$b=$d.SelectSingleNode('//w:body',$n)
$orig=@($b.SelectNodes('w:p',$n));$old=@()
foreach($p in $orig){$old+= (($p.SelectNodes('.//w:t',$n)|ForEach-Object {$_.InnerText}) -join '').Trim()}
$cover=@($orig[0..23]|ForEach-Object {$_.CloneNode($true)})
$sect=$b.SelectSingleNode('w:sectPr',$n).CloneNode($true)
$script:parts=[Collections.Generic.List[string]]::new()
$script:bookmark=1
function E([string]$t){[Security.SecurityElement]::Escape($t)}
function P([string]$t,[string]$role='body') {
 $align='both';$sz='24';$bold='';$extra='<w:widowControl/>';$spacing='w:after="120" w:line="360" w:lineRule="auto"'
 if($role -in @('chapter','front')){$align='center';$bold='<w:b/>';$extra+='<w:pageBreakBefore/><w:keepNext/>';$spacing='w:after="220" w:line="360" w:lineRule="auto"'}
 if($role -eq 'chapter'){$extra+='<w:outlineLvl w:val="0"/>'}
 if($role -eq 'subchapter'){$align='center';$bold='<w:b/>';$extra+='<w:keepNext/>'}
 if($role -eq 'h1'){$align='left';$bold='<w:b/>';$extra+='<w:keepNext/><w:outlineLvl w:val="1"/>';$spacing='w:before="180" w:after="100" w:line="360" w:lineRule="auto"'}
 if($role -eq 'h2'){$align='left';$bold='<w:b/>';$extra+='<w:keepNext/>';$spacing='w:before="100" w:after="60" w:line="360" w:lineRule="auto"'}
 if($role -eq 'caption'){$align='center';$bold='<w:b/>';$sz='22';$extra+='<w:keepNext/>';$spacing='w:before="120" w:after="100" w:line="260" w:lineRule="auto"'}
 if($role -eq 'small'){$align='left';$sz='22';$spacing='w:after="100" w:line="260" w:lineRule="auto"'}
 if($role -eq 'ref'){$align='left';$extra+='<w:ind w:left="720" w:hanging="720"/>'}
 $start='';$end=''
 if($role -eq 'caption' -and $t -match '^(Table|Figure) ([0-9]+)'){$name=$matches[1]+$matches[2];$start='<w:bookmarkStart w:id="'+$script:bookmark+'" w:name="'+$name+'"/>';$end='<w:bookmarkEnd w:id="'+$script:bookmark+'"/>';$script:bookmark++}
 $x='<w:p><w:pPr><w:spacing '+$spacing+'/><w:jc w:val="'+$align+'"/>'+$extra+'</w:pPr>'+$start+'<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="'+$sz+'"/><w:color w:val="000000"/>'+$bold+'</w:rPr><w:t xml:space="preserve">'+(E $t)+'</w:t></w:r>'+$end+'</w:p>'
 $script:parts.Add($x)
}
function L([string]$label,[string]$name){
 $x='<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9000"/></w:tabs><w:spacing w:after="140" w:line="300" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="24"/></w:rPr><w:t>'+(E $label)+'</w:t><w:tab/></w:r><w:fldSimple w:instr=" PAGEREF '+$name+' \h "><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p>'
 $script:parts.Add($x)
}
function T($item){
 $x='<w:tbl><w:tblPr><w:tblW w:w="9026" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>'
 foreach($ed in @('top','left','bottom','right','insideH','insideV')){$x+='<w:'+$ed+' w:val="single" w:sz="4" w:color="D9D9D9"/>'}
 $x+='</w:tblBorders><w:tblCellMar><w:top w:w="85" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="85" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>'
 foreach($w in $item.widths){$x+='<w:gridCol w:w="'+$w+'"/>'};$x+='</w:tblGrid>'
 $all=[Collections.Generic.List[object]]::new();$all.Add($item.headers);foreach($row in $item.rows){$all.Add($row)}
 for($ri=0;$ri -lt $all.Count;$ri++){
  $x+='<w:tr><w:trPr><w:cantSplit/>';if($ri -eq 0){$x+='<w:tblHeader/>'};$x+='</w:trPr>'
  for($ci=0;$ci -lt $item.headers.Count;$ci++){
   $fill='FFFFFF';$bold='';if($ri -eq 0){$fill='E7E6E6';$bold='<w:b/>'}
   $align='left';if($item.headers.Count -gt 4 -and $ci -gt 0){$align='center';if([string]$all[$ri][$ci] -eq 'X'){$fill='D9D9D9'}}
   $x+='<w:tc><w:tcPr><w:tcW w:w="'+$item.widths[$ci]+'" w:type="dxa"/><w:shd w:fill="'+$fill+'"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="'+$align+'"/><w:spacing w:after="0" w:line="260" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="21"/>'+$bold+'</w:rPr><w:t xml:space="preserve">'+(E ([string]$all[$ri][$ci]))+'</w:t></w:r></w:p></w:tc>'
  };$x+='</w:tr>'
 };$x+='</w:tbl>'; $script:parts.Add($x)
}
P 'TABLE OF CONTENTS' 'front'
$script:parts.Add('<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \o "1-2" \u \h </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Table of Contents</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>')
P 'LIST OF TABLES' 'front'
$labels=@('Project information','Functional requirements','Nonfunctional requirements','Technology stack','Firestore collection schema','Proposed API operations','Key test cases and expected outcomes','Deployment environments')
for($i=0;$i -lt 8;$i++){L ('Table '+($i+1)+'  '+$labels[$i]) ('Table'+($i+1))}
P 'LIST OF FIGURES' 'h2';L 'Figure 1  Proposed full development Gantt chart' 'Figure1'
$items=@();foreach($file in @('content0.json','content1.json')){$items+= @(Get-Content -LiteralPath (Join-Path $q $file) -Raw -Encoding UTF8 | ConvertFrom-Json)}
foreach($item in $items){
 if($item.type -eq 'source'){$t=$old[$item.index];if($item.index -eq 95){$t=$t.Replace('9(3).','9(3), 885-894.')};P ($item.prefix+$t) $item.role}
 elseif($item.type -eq 'p'){P $item.text $item.role}
 elseif($item.type -eq 'table'){T $item}
}
$b.RemoveAll();foreach($p in $cover){[void]$b.AppendChild($p)}
foreach($part in $script:parts){[xml]$temp=('<root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+$part+'</root>');$node=$d.ImportNode($temp.DocumentElement.FirstChild,$true);[void]$b.AppendChild($node)}
[void]$b.AppendChild($sect)
$stream=[IO.File]::Create($out);$dest=[IO.Compression.ZipArchive]::new($stream,[IO.Compression.ZipArchiveMode]::Create)
foreach($entry in $z.Entries){
 $ne=$dest.CreateEntry($entry.FullName,[IO.Compression.CompressionLevel]::Optimal);$target=$ne.Open()
 if($entry.FullName -eq 'word/document.xml'){$bytes=[Text.UTF8Encoding]::new($false).GetBytes($d.OuterXml);$target.Write($bytes,0,$bytes.Length)}
 else{$ins=$entry.Open();$ins.CopyTo($target);$ins.Dispose()}
 $target.Dispose()
};$dest.Dispose();$stream.Dispose();$z.Dispose();$s.Dispose()
'Reference retained; cover paragraphs 0-23 unchanged. A4, one-inch margins, Arial 12 body. Workflow-authorized clarifications only in original wording. Proposed timeline and tests; unsigned acceptance. All original package parts preserved during OOXML authoring. Native Word used for field refresh and visual QA because bundled runtime unavailable.' | Set-Content -LiteralPath (Join-Path $q 'artifact.md')
Write-Output "CREATED $out"
$word=$null
try{
 $word=New-Object -ComObject Word.Application;$word.Visible=$false;$word.DisplayAlerts=0
 $wd=$word.Documents.Open($out,$false,$false)
 foreach($id in @(-20,-21)) {try{$wd.Styles.Item($id).Font.Name='Arial';$wd.Styles.Item($id).Font.Size=12;$wd.Styles.Item($id).Font.Color=0}catch{}}
 $wd.Repaginate();foreach($toc in $wd.TablesOfContents){$toc.Update()};$wd.Fields.Update()|Out-Null
 $wd.Repaginate();$wd.Save();Write-Output ("PAGES "+$wd.ComputeStatistics(2))
 $wd.ExportAsFixedFormat((Join-Path $q 'final.pdf'),17)
 $wd.ExportAsFixedFormat((Join-Path $q 'final.xps'),18)
 $wd.Close(0)
 $rd=$word.Documents.Open($source,$false,$true);$rd.ExportAsFixedFormat((Join-Path $q 'reference.xps'),18);$rd.Close(0)
}finally{if($word){$word.Quit();[void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)}}
Add-Type -AssemblyName PresentationCore,PresentationFramework,WindowsBase,ReachFramework
function RenderXps([string]$path,[string]$prefix,[int]$limit=999){
 $xd=[System.Windows.Xps.Packaging.XpsDocument]::new($path,[IO.FileAccess]::Read)
 $seq=$xd.GetFixedDocumentSequence();$pg=$seq.DocumentPaginator;$pg.ComputePageCount()
 for($i=0;$i -lt [Math]::Min($pg.PageCount,$limit);$i++){
  $page=$pg.GetPage($i);$bmp=[Windows.Media.Imaging.RenderTargetBitmap]::new([int]($page.Size.Width*1.25),[int]($page.Size.Height*1.25),120,120,[Windows.Media.PixelFormats]::Pbgra32)
  $bmp.Render($page.Visual);$enc=[Windows.Media.Imaging.PngBitmapEncoder]::new();$enc.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($bmp))
  $f=[IO.File]::Create((Join-Path $q ($prefix+'-'+($i+1)+'.png')));$enc.Save($f);$f.Dispose()
 };Write-Output ($prefix+' rendered '+$pg.PageCount+' pages');$xd.Close()
}
RenderXps (Join-Path $q 'final.xps') 'page'
RenderXps (Join-Path $q 'reference.xps') 'reference' 1

