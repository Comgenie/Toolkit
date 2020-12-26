using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Connections.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace ToolkitServer.Controllers
{
    [ApiController]
    [Route("{controller}/{action}")]
    public class StorageController : Controller
    {
        [HttpPost]
        public async Task<IActionResult> Store(string clientId, string container=null, string fileName=null, DateTime? expirationDate = null, List<IFormFile> files=null)
        {
            if (files.Count == 0)
                return Json("No files uploaded");

            string origFileName = null;
            IdentityHandler.InternalIdentity identity = null;
            // Store a file and return static url to data
            if (!string.IsNullOrEmpty(container))
            {
                // Private container
                identity = await IdentityHandler.GetIdentityAsync(clientId, container);
                if (identity == null)
                {
                    Response.StatusCode = 403;
                    return Json("Could not retrieve Identity data");
                }
                if (!identity.Data.allowFileWrite)
                {
                    Response.StatusCode = 403;
                    return Json("No write-access");
                }
            }
            else
            {
                // Public 'container'. This generates a random file name and will put it in a container which cannot be listed/deleted
                container = "public";
                origFileName = fileName ?? files.FirstOrDefault()?.FileName;
                fileName = Guid.NewGuid().ToString();
            }

            // Upload
            BlobContainerClient azureContainerClient = new BlobContainerClient(Startup.Configuration.GetConnectionString("StorageConnectionString"), Startup.Configuration.GetValue<string>("StorageContainer"));
            var tkContainer = await GetStorageContainerData(azureContainerClient, container, true);
            if (tkContainer == null)
            {
                Response.StatusCode = 500;
                return Json("Internal error");
            }

            var filesUploaded = new List<object>();
            

            foreach (var file in files)
            {                
                if (container == "public" || (string.IsNullOrEmpty(fileName) && string.IsNullOrEmpty(file.FileName)))
                    fileName = GetRandomString(); // Generate a random short code as filename
                else if (string.IsNullOrEmpty(fileName) && !string.IsNullOrEmpty(file.FileName))
                    fileName = file.FileName;
                
                fileName = fileName.Replace("\\", "").Replace("\"","").Replace("..", "").Replace(":", "");
                if (fileName.StartsWith("/"))
                    fileName = fileName.Substring(1);

                var uploadFileName = tkContainer.Code + "/" + GetRandomString() + "_" + fileName;
                var fileBlob = azureContainerClient.GetBlobClient(uploadFileName);

                var ext = Path.GetExtension(fileName).ToLower();                
                var headers = new Azure.Storage.Blobs.Models.BlobHttpHeaders();
                headers.ContentDisposition = "inline";                
                headers.CacheControl = "public, max-age=31536000";

                var contentType = GetContentType(origFileName ?? fileName);
                if (contentType == null)
                {
                    // Only allow to download this file
                    headers.ContentDisposition = "attachment; filename=\"" + fileName + "\"";
                    headers.ContentType = "application/octet-stream";
                }
                else
                {
                    headers.ContentType = contentType;
                }
                
                using (var fileStream = file.OpenReadStream())
                {
                    await fileBlob.UploadAsync(fileStream, new Azure.Storage.Blobs.Models.BlobUploadOptions()
                    {
                        HttpHeaders = headers,
                        Metadata = new Dictionary<string, string>
                        {
                            { "UploadedByClientId", clientId },
                            { "UploadedByIdentifier", identity?.Data?.publicIdentifier ?? "- Unknown -" },
                            { "UploadedByIP", Request.HttpContext.Connection.RemoteIpAddress.ToString() }
                        }
                    });
                }                

                filesUploaded.Add(new
                {
                    FileName = fileName,
                    Url = Startup.Configuration.GetValue<string>("StorageUrlPrefix") + uploadFileName,
                    ContentType = headers.ContentType
                });

                fileName = null; // We only allow a custom filename passed by the first upload
            } 
            
            return Json(filesUploaded);
        }

        
        /// These methods are only available for private storage (containers started with https:// and with a valid identty with the right permissions set)         
        [HttpPost]
        public async Task<IActionResult> List([FromBody]PostData postData)
        {
            // Retrieve all files from private storage
            IdentityHandler.InternalIdentity identity = await IdentityHandler.GetIdentityAsync(postData.clientId, postData.container);
            if (identity == null)
            {
                Response.StatusCode = 403;
                return Json("Could not retrieve Identity data");
            }
            if (!identity.Data.allowFileList)
            {
                Response.StatusCode = 403;
                return Json("No list-access");
            }
            if (!identity.Data.allowFileRead)
            {
                Response.StatusCode = 403;
                return Json("No read-access");
            }

            BlobContainerClient azureContainerClient = new BlobContainerClient(Startup.Configuration.GetConnectionString("StorageConnectionString"), Startup.Configuration.GetValue<string>("StorageContainer"));
            var tkContainer = await GetStorageContainerData(azureContainerClient, postData.container);
            if (tkContainer == null)
            {
                Response.StatusCode = 404;
                return Json("Not found");
            }

            var files = new List<object>();
            await foreach (var uploadedBlob in azureContainerClient.GetBlobsAsync(Azure.Storage.Blobs.Models.BlobTraits.Metadata, Azure.Storage.Blobs.Models.BlobStates.None, tkContainer.Code + "/"))
            {
                files.Add(new
                {
                    FileName = GetFileNameFromBlobName(uploadedBlob.Name, true),
                    UploadName = GetFileNameFromBlobName(uploadedBlob.Name),
                    Url = Startup.Configuration.GetValue<string>("StorageUrlPrefix") + uploadedBlob.Name,
                    ContentType = GetContentType(uploadedBlob.Name),
                    UploadedBy = uploadedBlob.Metadata.ContainsKey("UploadedByIdentifier") ? uploadedBlob.Metadata["UploadedByIdentifier"] : null
                });
            }            
            return Json(files);
        }

        [HttpPost]
        public async Task<IActionResult> Retrieve([FromBody]PostData postData)
        {
            // Retrieve static url to private storage data (and meta data)
            IdentityHandler.InternalIdentity identity = await IdentityHandler.GetIdentityAsync(postData.clientId, postData.container);
            if (identity == null)
            {
                Response.StatusCode = 403;
                return Json("Could not retrieve Identity data");
            }
            if (!identity.Data.allowFileRead)
            {
                Response.StatusCode = 403;
                return Json("No read-access");
            }

            BlobContainerClient azureContainerClient = new BlobContainerClient(Startup.Configuration.GetConnectionString("StorageConnectionString"), Startup.Configuration.GetValue<string>("StorageContainer"));
            var tkContainer = await GetStorageContainerData(azureContainerClient, postData.container);
            if (tkContainer == null)
            {
                Response.StatusCode = 404;
                return Json("Not found");
            }

            var blobFile = azureContainerClient.GetBlobClient(tkContainer.Code + "/" + postData.fileName);
            var exists = await blobFile.ExistsAsync();
            if (!exists.Value)
            {
                Response.StatusCode = 404;
                return Json("Not found");
            }

            if (postData.directly)
            {
                var downloadStream = await blobFile.OpenReadAsync();
                return File(downloadStream, GetContentType(blobFile.Name));
            }

            return Json(new
            {
                FileName = GetFileNameFromBlobName(blobFile.Name, true),
                UploadName = GetFileNameFromBlobName(blobFile.Name),
                Url = Startup.Configuration.GetValue<string>("StorageUrlPrefix") + blobFile.Name,
                ContentType = GetContentType(blobFile.Name) 
            });
        }
        [HttpPost]
        public async Task<IActionResult> Delete([FromBody]PostData postData)
        {
            // Delete file from private storage
            IdentityHandler.InternalIdentity identity = await IdentityHandler.GetIdentityAsync(postData.clientId, postData.container);
            if (identity == null)
            {
                Response.StatusCode = 403;
                return Json("Could not retrieve Identity data");
            }
            if (!identity.Data.allowFileDelete)
            {
                Response.StatusCode = 403;
                return Json("No delete-access");
            }

            BlobContainerClient azureContainerClient = new BlobContainerClient(Startup.Configuration.GetConnectionString("StorageConnectionString"), Startup.Configuration.GetValue<string>("StorageContainer"));
            var tkContainer = await GetStorageContainerData(azureContainerClient, postData.container);
            if (tkContainer == null)
            {
                Response.StatusCode = 404;
                return Json("Not found");
            }

            var blobFile = azureContainerClient.GetBlobClient(tkContainer.Code + "/" + postData.fileName);
            await blobFile.DeleteIfExistsAsync();
            return Json("OK");
        }

        private async static Task<StorageContainerData> GetStorageContainerData(BlobContainerClient containerClient, string container, bool createIfMissing = false)
        {
            var blob = containerClient.GetBlobClient("containers.json");
            StorageData storageData = null;
            try
            {
                var ms = new MemoryStream();
                await blob.DownloadToAsync(ms);
                ms.Position = 0;
                storageData = await System.Text.Json.JsonSerializer.DeserializeAsync<StorageData>(ms);
            }
            catch (Azure.RequestFailedException ex) when (ex.Status == 404)
            {
                // First time
                storageData = new StorageData()
                {
                    Containers = new Dictionary<string, StorageContainerData>()
                };
            }
            catch
            {
                return null;
            }

            var containerKey = container.ToLower();
            if (!storageData.Containers.ContainsKey(containerKey))
            {
                if (!createIfMissing)
                    return null;
                try
                {
                    storageData.Containers.Add(containerKey, new StorageContainerData()
                    {
                        Container = container,
                        Code = GetRandomString()
                    });
                    var ms = new MemoryStream();
                    await System.Text.Json.JsonSerializer.SerializeAsync<StorageData>(ms, storageData);
                    ms.Position = 0;
                    await blob.UploadAsync(ms, true);
                }
                catch
                {
                    return null;
                }
            }
            return storageData.Containers[containerKey];
        }
        private static string GetFileNameFromBlobName(string blobName, bool includePrefix = false)
        {
            if (includePrefix)
                return blobName.Substring(blobName.IndexOf("/") + 1);
            return blobName.Substring(blobName.IndexOf("_") + 1);
        }
        private static string GetRandomString()
        {
            var randomHex = Guid.NewGuid().ToString().Replace("-", "").ToLower().Substring(0, 16);
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(randomHex)).Replace("=", "").Replace("+", "A").Replace("/", "B").Replace("_", "C");
        }
        private static string GetContentType(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
                return null;

            var ext = Path.GetExtension(fileName).ToLower();
            if (ext == ".jpg" || ext == ".jpeg")
                return "image/jpeg";
            else if (ext == ".png")
                return "image/png";
            else if (ext == ".gif")
                return "image/gif";
            else if (ext == ".txt")
                return "text/plain";
            else if (ext == ".pdf")
                return "application/pdf";
            return null;
        }

        public class PostData // Class to accept post values, because ASP.NET Core stinks
        {
            public string clientId { get; set; }
            public string container { get; set; }
            public string fileName { get; set; }
            public bool directly { get; set; }
        }
        class StorageData
        {
            public Dictionary<string, StorageContainerData> Containers { get; set; } // Toolkit containers
        }
        class StorageContainerData
        {
            public string Container { get; set; }
            public string Code { get; set; } // Random unique identifier, all files are saved with this as prefix
        }
    }
}
