package argala;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.Test;
import static org.junit.Assert.*;

public class RendererArchiveTest {
    private Map<String, byte[]> entries(byte[] archive) throws IOException {
        Map<String, byte[]> result = new LinkedHashMap<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(archive))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (!entry.isDirectory()) {
                    assertNull("duplicate entry: " + entry.getName(), result.put(entry.getName(), zip.readAllBytes()));
                }
            }
        }
        return result;
    }

    @Test public void replacesOnlyListenerAndPreservesNativeLibrariesResourcesAndOtherClasses() throws Exception {
        Map<String, byte[]> original = entries(Files.readAllBytes(Path.of(System.getProperty("argala.originalRenderer"))));
        Map<String, byte[]> patched = entries(Files.readAllBytes(Path.of(System.getProperty("argala.patchedRenderer"))));
        assertEquals(original.keySet(), patched.keySet());
        Map<String, byte[]> originalClasses = entries(original.remove("classes.jar"));
        Map<String, byte[]> patchedClasses = entries(patched.remove("classes.jar"));
        for (String name : original.keySet()) assertArrayEquals(name, original.get(name), patched.get(name));
        assertEquals(originalClasses.keySet(), patchedClasses.keySet());
        String listener = "com/viro/core/internal/ViroTouchGestureListener.class";
        byte[] replacement = patchedClasses.remove(listener);
        assertFalse("listener must actually change", Arrays.equals(originalClasses.remove(listener), replacement));
        assertEquals("Java 17 bytecode", 61, ((replacement[6] & 255) << 8) | (replacement[7] & 255));
        for (String name : originalClasses.keySet()) assertArrayEquals(name, originalClasses.get(name), patchedClasses.get(name));
    }
}
