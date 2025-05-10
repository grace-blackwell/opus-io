import { NextRequest, NextResponse } from "next/server";
import { getDiagram, updateDiagram } from "@/lib/queries";

// GET handler to provide the diagram XML to draw.io
export async function GET(
  request: NextRequest,
  { params }: { params: { diagramId: string } }
) {
  try {
    const { diagramId } = params;

    // Get the diagram from the database
    const diagram = await getDiagram(diagramId);

    if (!diagram) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    // Always return the diagram XML content for draw.io
    return new NextResponse(diagram.content, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="diagram-${diagramId}.xml"`,
      },
    });
  } catch (error) {
    console.error("Error getting diagram:", error);
    return NextResponse.json(
      { error: "Failed to get diagram" },
      { status: 500 }
    );
  }
}

// POST handler to save the diagram XML from draw.io
export async function POST(
  request: NextRequest,
  { params }: { params: { diagramId: string } }
) {
  try {
    const { diagramId } = params;

    // Check if the request is a form data request
    const contentType = request.headers.get("content-type") || "";

    // Log the request for debugging
    console.log("POST request to /api/diagrams/", diagramId);
    console.log("Content-Type:", contentType);

    // Check if this is a direct XML post (common with draw.io)
    if (
      contentType.includes("application/xml") ||
      contentType.includes("text/xml") ||
      contentType.includes("application/octet-stream") ||
      contentType.includes("text/plain")
    ) {
      console.log("Direct XML post detected");
      const content = await request.text();

      // Log the first 100 characters of the content for debugging
      console.log("Content (first 100 chars):", content.substring(0, 100));

      // Check if the content is actually XML
      if (
        !content.trim().startsWith("<?xml") &&
        !content.trim().startsWith("<mxfile")
      ) {
        console.error("Content is not XML");
        return NextResponse.json(
          { error: "Invalid content format" },
          { status: 400 }
        );
      }

      const xmlContent = content;

      // Get the diagram name from the XML content
      let diagramName = "New Diagram";
      try {
        // Try to extract the diagram name from the XML
        const nameMatch = xmlContent.match(/<diagram.*?name="([^"]*)".*?>/);
        if (nameMatch && nameMatch[1]) {
          diagramName = nameMatch[1];
        }
      } catch (error) {
        console.error("Error extracting diagram name:", error);
      }

      // Update the diagram with the new content and name
      await updateDiagram(diagramId, {
        name: diagramName,
        content: xmlContent,
      });

      // Return a success response
      return new NextResponse("ok", {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    let xmlContent = "";

    if (contentType.includes("multipart/form-data")) {
      // Handle form data request (from draw.io)
      const formData = await request.formData();

      // Log the form data keys for debugging
      console.log("Form data keys:", Array.from(formData.keys()));

      // Check for different possible field names
      let xmlFile =
        (formData.get("xmlfile") as File) || (formData.get("xml") as File);
      const pngFile =
        (formData.get("pngfile") as File) || (formData.get("png") as File);

      // If we don't have an XML file, check for a 'upfile' field which might contain the XML
      if (!xmlFile && formData.has("upfile")) {
        xmlFile = formData.get("upfile") as File;
      }

      // If we still don't have an XML file, check all fields for XML content
      if (!xmlFile) {
        for (const entry of formData.entries()) {
          const value = entry[1]; // Get the value directly without destructuring
          if (typeof value === "string" && value.trim().startsWith("<?xml")) {
            xmlContent = value;
            break;
          } else if (value instanceof File) {
            try {
              const content = await value.text();
              if (content.trim().startsWith("<?xml")) {
                xmlContent = content;
                break;
              }
            } catch (e) {
              console.error("Error reading file content:", e);
            }
          }
        }
      } else {
        xmlContent = await xmlFile.text();
      }

      if (!xmlContent) {
        console.error("No XML content found in form data");
        return NextResponse.json(
          { error: "No diagram data provided" },
          { status: 400 }
        );
      }

      // Log the first 100 characters of the XML content for debugging
      console.log(
        "XML content (first 100 chars):",
        xmlContent.substring(0, 100)
      );

      // Get the diagram name from the XML content
      let diagramName = "New Diagram";
      try {
        // Try to extract the diagram name from the XML
        const nameMatch = xmlContent.match(/<diagram.*?name="([^"]*)".*?>/);
        if (nameMatch && nameMatch[1]) {
          diagramName = nameMatch[1];
        }
      } catch (error) {
        console.error("Error extracting diagram name:", error);
      }

      // If we have a PNG file, use it as the thumbnail
      let thumbnail = undefined;

      if (pngFile) {
        try {
          const pngBuffer = await pngFile.arrayBuffer();
          const pngBase64 = Buffer.from(pngBuffer).toString("base64");
          thumbnail = `data:image/png;base64,${pngBase64}`;
        } catch (e) {
          console.error("Error processing PNG file:", e);
        }
      }

      // Check for PNG data in other fields if we don't have a thumbnail yet
      if (!thumbnail) {
        for (const [key, value] of formData.entries()) {
          if (key.includes("png") || key.includes("image")) {
            try {
              if (
                typeof value === "string" &&
                value.startsWith("data:image/png;base64,")
              ) {
                thumbnail = value;
                break;
              } else if (value instanceof File) {
                const buffer = await value.arrayBuffer();
                const base64 = Buffer.from(buffer).toString("base64");
                thumbnail = `data:image/png;base64,${base64}`;
                break;
              }
            } catch (e) {
              console.error("Error processing potential PNG data:", e);
            }
          }
        }
      }

      // Update the diagram with the new content, name, and thumbnail if available
      const updateData: {
        name: string;
        content: string;
        thumbnail?: string;
      } = {
        name: diagramName,
        content: xmlContent,
      };

      if (thumbnail) {
        updateData.thumbnail = thumbnail;
      }

      await updateDiagram(diagramId, updateData);

      // For draw.io, we need to return a success response in the format it expects
      // This should be a simple text response with the word "ok"
      return new NextResponse("ok", {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    } else {
      // Handle JSON request (from our app)
      try {
        const data = await request.json();
        xmlContent = data.xml;

        if (!xmlContent) {
          console.error("No xml in JSON data");
          return NextResponse.json(
            { error: "No diagram data provided" },
            { status: 400 }
          );
        }
      } catch (e) {
        console.error("Failed to parse request body:", e);
        return NextResponse.json(
          { error: "Invalid request format" },
          { status: 400 }
        );
      }
    }

    // Get the diagram name from the XML content
    let diagramName = "New Diagram";
    try {
      // Try to extract the diagram name from the XML
      const nameMatch = xmlContent.match(/<diagram.*?name="([^"]*)".*?>/);
      if (nameMatch && nameMatch[1]) {
        diagramName = nameMatch[1];
      }
    } catch (error) {
      console.error("Error extracting diagram name:", error);
    }

    // Update the diagram with the new content and name
    const updateData: {
      name: string;
      content: string;
    } = {
      name: diagramName,
      content: xmlContent,
    };

    await updateDiagram(diagramId, updateData);

    // For draw.io, we need to return a success response in the format it expects
    // This should be a simple text response with the word "ok"
    return new NextResponse("ok", {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error updating diagram:", error);
    return NextResponse.json(
      { error: "Failed to update diagram" },
      { status: 500 }
    );
  }
}
